from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from google import genai
from google.genai import types
import os
from config.settings import settings
from database.connection import get_db_connection
from services.api_key_manager import api_key_manager

app = FastAPI(title="RAG Chat Service")

class ChatRequest(BaseModel):
    question: str
    user_id: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class RAGService:
    def __init__(self):
        self.qdrant_client = None
        self._init_qdrant()
    
    def _init_qdrant(self):
        """Initialize Qdrant client"""
        try:
            self.qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            print("✅ Qdrant client initialized for RAG")
        except Exception as e:
            print(f"❌ Failed to initialize Qdrant: {e}")
    
    def search_qdrant(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search Qdrant for relevant documents"""
        try:
            # Get active API key for embedding model
            api_key_data = api_key_manager.get_active_api_key()
            if not api_key_data:
                raise Exception("No active API key available")
            
            # Generate embedding for query
            client = genai.Client(api_key=api_key_data['apiKey'])
            embedding_model = api_key_data.get('embeddingModelName')
            
            response = client.models.embed_content(
                model=embedding_model,
                contents=query,
                config=types.EmbedContentConfig(task_type="retrieval_query")
            )
            query_vector = response.embeddings[0].values
            
            # Search all collections
            all_results = []
            collections = ['posts', 'documents', 'knowledge_base']
            
            for collection in collections:
                try:
                    search_results = self.qdrant_client.query_points(
                        collection_name=collection,
                        query=query_vector,
                        limit=limit,
                        score_threshold=0.5
                    )
                    
                    for result in search_results.points:
                        # Use record_id as the appropriate ID based on collection type
                        record_id = result.payload.get('record_id', '')
                        post_id = result.payload.get('post_id') or (record_id if collection == 'posts' else None)
                        document_id = result.payload.get('document_id') or (record_id if collection == 'documents' else None)
                        kb_id = result.payload.get('kb_id') or (record_id if collection == 'knowledge_base' else None)
                        
                        all_results.append({
                            'collection': collection,
                            'score': result.score,
                            'text': result.payload.get('text', ''),
                            'record_id': record_id,
                            'chunk_index': result.payload.get('chunk_index', 0),
                            'metadata': {
                                'type': result.payload.get('type', collection),
                                'title': result.payload.get('title', ''),
                                'author': result.payload.get('author', ''),
                                'post_id': post_id,
                                'document_id': document_id,
                                'kb_id': kb_id
                            }
                        })
                except Exception as e:
                    print(f"⚠️  Failed to search collection {collection}: {e}")
            
            # Sort by score and return top results
            all_results.sort(key=lambda x: x['score'], reverse=True)
            return all_results[:limit]
            
        except Exception as e:
            print(f"❌ Qdrant search failed: {e}")
            return []
    
    def generate_response_stream(self, question: str, context: str, history: List[Dict[str, str]]):
        """Generate streaming response using AI"""
        try:
            api_key_data = api_key_manager.get_active_api_key()
            if not api_key_data:
                raise Exception("No active API key available")
            
            client = genai.Client(api_key=api_key_data['apiKey'])
            llm_model = api_key_data.get('llmModelName')
            
            # Build system prompt for domain-specific responses
            system_prompt = """You are an agricultural expert assistant for Ayar Farm. 
            You ONLY answer questions about:
            - Farming (crops, soil, irrigation, pesticides, fertilizers)
            - Livestock (pigs, cattle, poultry, fish farming)
            - Breeder (animal breeding, livestock management)
            
            IMPORTANT RULES:
            1. Only use information from the provided context (documents, posts, knowledge base)
            2. If the question is outside these domains, politely decline
            3. If the context doesn't contain relevant information, say so
            4. Do not use external knowledge or make up information
            5. Provide practical, actionable advice based on the context
            6. Answer in the same language as the question (Myanmar or English)
            
            Context from our database:
            {context}
            """
            
            # Build conversation history for Google GenAI
            # Convert role format: USER -> user, ASSISTANT -> model
            # Include history in contents array
            contents = []
            for msg in history:
                contents.append({
                    "role": "user" if msg['role'] == 'USER' else "model",
                    "parts": [{"text": msg['content']}]
                })
            
            # Add current question
            contents.append({
                "role": "user",
                "parts": [{"text": question}]
            })
            
            # Generate streaming response
            response = client.models.generate_content_stream(
                model=llm_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt.format(context=context)
                )
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"❌ Response generation failed: {e}")
            yield f"Error: {str(e)}"
    
    def check_domain_relevance(self, question: str) -> bool:
        """Check if question is relevant to farming/livestock/breeder domain"""

        farming_keywords = [
            # General Agriculture
            'farm', 'လယ်ယာ',
            'farmer', 'လယ်သမား',
            'farming', 'လယ်ယာလုပ်ငန်း',
            'agriculture', 'စိုက်ပျိုးရေး',
            'agricultural', 'စိုက်ပျိုးရေးဆိုင်ရာ',
            'crop', 'သီးနှံ',
            'crops', 'သီးနှံများ',
            'cultivation', 'စိုက်ပျိုးခြင်း',
            'cultivate', 'စိုက်ပျိုးသည်',
            'plant', 'အပင်',
            'plants', 'အပင်များ',
            'planting', 'စိုက်ပျိုးခြင်း',
            'plantation', 'စိုက်ခင်း',
            'field', 'လယ်ကွင်း',
            'farmland', 'လယ်မြေ',
            'land', 'မြေ',
            'garden', 'ဥယျာဉ်',
            'gardening', 'ဥယျာဉ်စိုက်ပျိုးခြင်း',
            'vegetable', 'ဟင်းသီးဟင်းရွက်',
            'vegetables', 'ဟင်းသီးဟင်းရွက်များ',
            'fruit', 'သစ်သီး',
            'fruits', 'သစ်သီးများ',
            'orchard', 'သစ်သီးခြံ',
            'nursery', 'ပျိုးခင်း',

            # Crops
            'rice', 'ဆန်',
            'paddy', 'စပါး',
            'wheat', 'ဂျုံ',
            'corn', 'ပြောင်း',
            'maize', 'ပြောင်း',
            'bean', 'ပဲ',
            'beans', 'ပဲများ',
            'pea', 'ပဲစိမ်း',
            'peas', 'ပဲစိမ်းများ',
            'sesame', 'နှမ်း',
            'peanut', 'မြေပဲ',
            'groundnut', 'မြေပဲ',
            'sunflower', 'နေကြာ',
            'cotton', 'ဝါ',
            'sugarcane', 'ကြံ',
            'potato', 'အာလူး',
            'tomato', 'ခရမ်းချဉ်သီး',
            'onion', 'ကြက်သွန်နီ',
            'garlic', 'ကြက်သွန်ဖြူ',
            'chili', 'ငရုတ်သီး',
            'pepper', 'ငရုတ်ကောင်း',
            'cabbage', 'ဂေါ်ဖီထုပ်',
            'cucumber', 'သခွားသီး',
            'eggplant', 'ခရမ်းသီး',
            'soybean', 'ပဲပုပ်',
            'cassava', 'ပီလောပီနံ',
            'yam', 'ဥမျိုး',
            'banana', 'ငှက်ပျောသီး',
            'mango', 'သရက်သီး',
            'papaya', 'သင်္ဘောသီး',
            'watermelon', 'ဖရဲသီး',
            'coconut', 'အုန်းသီး',
            'tea', 'လက်ဖက်',
            'coffee', 'ကော်ဖီ',

            # Soil / Land
            'soil', 'မြေဆီလွှာ',
            'soil health', 'မြေဆီလွှာကျန်းမာရေး',
            'soil fertility', 'မြေဆီလွှာမြေဩဇာကောင်းမွန်မှု',
            'fertile soil', 'မြေဩဇာကောင်းသောမြေ',
            'compost', 'မြေဆွေး',
            'composting', 'မြေဆွေးပြုလုပ်ခြင်း',
            'manure', 'သဘာဝမြေဩဇာ',
            'organic matter', 'အော်ဂဲနစ်ပစ္စည်း',
            'plough', 'ထွန်',
            'plowing', 'ထွန်ယက်ခြင်း',
            'ploughing', 'ထွန်ယက်ခြင်း',
            'tillage', 'မြေထွန်ယက်ခြင်း',
            'land preparation', 'မြေပြင်ဆင်ခြင်း',
            'erosion', 'မြေဆီလွှာတိုက်စားခြင်း',
            'soil erosion', 'မြေဆီလွှာတိုက်စားခြင်း',
            'nutrient', 'အာဟာရဓာတ်',
            'nutrients', 'အာဟာရဓာတ်များ',
            'nitrogen', 'နိုက်ထရိုဂျင်',
            'phosphorus', 'ဖော့စဖရပ်',
            'potassium', 'ပိုတက်စီယမ်',
            'NPK', 'NPK မြေဩဇာ',

            # Water / Irrigation
            'water', 'ရေ',
            'watering', 'ရေလောင်းခြင်း',
            'irrigation', 'ရေသွင်းခြင်း',
            'irrigate', 'ရေသွင်းသည်',
            'irrigation system', 'ရေသွင်းစနစ်',
            'drip irrigation', 'အစက်ချရေသွင်းစနစ်',
            'sprinkler', 'ရေဖျန်းစနစ်',
            'sprinkler irrigation', 'ရေဖျန်းရေသွင်းစနစ်',
            'water pump', 'ရေစုပ်စက်',
            'pump', 'စုပ်စက်',
            'water supply', 'ရေပေးဝေမှု',
            'rainwater', 'မိုးရေ',
            'rainfall', 'မိုးရေချိန်',
            'drought', 'မိုးခေါင်ခြင်း',
            'flood', 'ရေကြီးခြင်း',
            'drainage', 'ရေစီးဆင်းမှုစနစ်',

            # Fertilizer
            'fertilizer', 'မြေဩဇာ',
            'fertiliser', 'မြေဩဇာ',
            'fertilize', 'မြေဩဇာထည့်သည်',
            'organic fertilizer', 'သဘာဝမြေဩဇာ',
            'chemical fertilizer', 'ဓာတုမြေဩဇာ',
            'NPK fertilizer', 'NPK မြေဩဇာ',
            'urea', 'ယူရီးယား',
            'DAP', 'DAP မြေဩဇာ',
            'potash', 'ပိုတက်ရှ်',

            # Pest / Disease
            'pest', 'ပိုးမွှား',
            'pests', 'ပိုးမွှားများ',
            'pesticide', 'ပိုးသတ်ဆေး',
            'pesticides', 'ပိုးသတ်ဆေးများ',
            'insecticide', 'အင်းဆက်ပိုးသတ်ဆေး',
            'herbicide', 'ပေါင်းသတ်ဆေး',
            'fungicide', 'မှိုသတ်ဆေး',
            'weed', 'ပေါင်းပင်',
            'weeds', 'ပေါင်းပင်များ',
            'weed control', 'ပေါင်းပင်ထိန်းချုပ်ခြင်း',
            'insect', 'အင်းဆက်ပိုး',
            'insects', 'အင်းဆက်ပိုးများ',
            'crop disease', 'သီးနှံရောဂါ',
            'plant disease', 'အပင်ရောဂါ',
            'disease', 'ရောဂါ',
            'fungus', 'မှို',
            'fungal', 'မှိုဆိုင်ရာ',
            'virus', 'ဗိုင်းရပ်စ်',
            'bacteria', 'ဘက်တီးရီးယား',
            'aphid', 'အပင်စုပ်ပိုး',
            'caterpillar', 'လိပ်ပြာလောင်း',
            'beetle', 'ပိုးတောင်မာ',
            'locust', 'ကျိုင်းကောင်',

            # Seeds / Harvest
            'seed', 'မျိုးစေ့',
            'seeds', 'မျိုးစေ့များ',
            'seedling', 'ပျိုးပင်',
            'seedlings', 'ပျိုးပင်များ',
            'seed variety', 'မျိုးစေ့အမျိုးအစား',
            'hybrid seed', 'စပ်မျိုးစေ့',
            'germination', 'မျိုးစေ့အပင်ပေါက်ခြင်း',
            'sowing', 'မျိုးစေ့ချခြင်း',
            'sow', 'မျိုးစေ့ချသည်',
            'transplant', 'ပျိုးပင်ပြောင်းစိုက်သည်',
            'harvest', 'ရိတ်သိမ်းခြင်း',
            'harvesting', 'ရိတ်သိမ်းခြင်း',
            'yield', 'အထွက်နှုန်း',
            'production', 'ထုတ်လုပ်မှု',
            'post-harvest', 'ရိတ်သိမ်းပြီးနောက်',
            'storage', 'သိုလှောင်ခြင်း',
            'grain', 'သီးနှံစေ့',
            'grains', 'သီးနှံစေ့များ',

            # Modern Farming
            'organic farming', 'သဘာဝစိုက်ပျိုးရေး',
            'sustainable farming', 'ရေရှည်တည်တံ့သော စိုက်ပျိုးရေး',
            'smart farming', 'စမတ်စိုက်ပျိုးရေး',
            'precision farming', 'တိကျစိုက်ပျိုးရေး',
            'precision agriculture', 'တိကျသော စိုက်ပျိုးရေး',
            'greenhouse', 'ဖန်လုံအိမ်',
            'hydroponics', 'ရေစိုက်ပျိုးရေး',
            'vertical farming', 'ဒေါင်လိုက်စိုက်ပျိုးရေး',
            'agritech', 'စိုက်ပျိုးရေးနည်းပညာ',
            'farm technology', 'လယ်ယာနည်းပညာ',
            'farm equipment', 'လယ်ယာသုံးစက်ကိရိယာ',
            'tractor', 'ထွန်စက်',
            'machinery', 'စက်ယန္တရားများ'
        ]

        livestock_keywords = [
            # General Livestock
            'livestock', 'မွေးမြူရေး',
            'livestock farming', 'တိရစ္ဆာန်မွေးမြူရေး',
            'animal', 'တိရစ္ဆာန်',
            'animals', 'တိရစ္ဆာန်များ',
            'animal farming', 'တိရစ္ဆာန်မွေးမြူရေး',
            'animal husbandry', 'တိရစ္ဆာန်မွေးမြူရေး',
            'husbandry', 'မွေးမြူရေး',
            'breeding', 'မျိုးပွားခြင်း',
            'breed', 'မျိုးစိတ်',
            'breeds', 'မျိုးစိတ်များ',
            'breeder', 'မွေးမြူသူ',
            'feeding', 'အစာကျွေးခြင်း',
            'feed', 'တိရစ္ဆာန်အစာ',
            'fodder', 'တိရစ္ဆာန်အစာ',
            'animal feed', 'တိရစ္ဆာန်အစာ',
            'veterinary', 'တိရစ္ဆာန်ဆေးကု',
            'vet', 'တိရစ္ဆာန်ဆေးကုဆရာဝန်',
            'veterinarian', 'တိရစ္ဆာန်ဆေးကုဆရာဝန်',
            'animal health', 'တိရစ္ဆာန်ကျန်းမာရေး',
            'animal disease', 'တိရစ္ဆာန်ရောဂါ',
            'vaccination', 'ကာကွယ်ဆေးထိုးခြင်း',
            'vaccine', 'ကာကွယ်ဆေး',
            'medicine', 'ဆေးဝါး',

            # Cattle
            'cattle', 'နွား',
            'cow', 'နွားမ',
            'cows', 'နွားများ',
            'bull', 'နွားထီး',
            'bulls', 'နွားထီးများ',
            'calf', 'နွားကလေး',
            'calves', 'နွားကလေးများ',
            'beef', 'နွားသား',
            'dairy cattle', 'နို့စားနွား',
            'dairy cow', 'နို့စားနွားမ',
            'beef cattle', 'အသားစားနွား',
            'cattle farming', 'နွားမွေးမြူရေး',
            'cattle breeding', 'နွားမျိုးပွားရေး',

            # Pig
            'pig', 'ဝက်',
            'pigs', 'ဝက်များ',
            'piglet', 'ဝက်ကလေး',
            'piglets', 'ဝက်ကလေးများ',
            'swine', 'ဝက်',
            'pork', 'ဝက်သား',
            'pig farming', 'ဝက်မွေးမြူရေး',
            'pig breeding', 'ဝက်မျိုးပွားရေး',
            'sow', 'ဝက်မ',
            'boar', 'ဝက်ထီး',

            # Chicken / Poultry
            'chicken', 'ကြက်',
            'chickens', 'ကြက်များ',
            'poultry', 'ကြက်မွေးမြူရေး',
            'poultry farming', 'ကြက်မွေးမြူရေး',
            'broiler', 'အသားစားကြက်',
            'broilers', 'အသားစားကြက်များ',
            'layer', 'ဥစားကြက်',
            'layers', 'ဥစားကြက်များ',
            'chick', 'ကြက်ကလေး',
            'chicks', 'ကြက်ကလေးများ',
            'rooster', 'ကြက်ဖ',
            'hen', 'ကြက်မ',
            'hens', 'ကြက်မများ',
            'egg', 'ကြက်ဥ',
            'eggs', 'ကြက်ဥများ',
            'egg production', 'ကြက်ဥထုတ်လုပ်မှု',
            'chicken feed', 'ကြက်စာ',
            'poultry feed', 'ကြက်မွေးမြူရေးအစာ',
            'poultry disease', 'ကြက်ရောဂါ',

            # Duck
            'duck', 'ဘဲ',
            'ducks', 'ဘဲများ',
            'duck farming', 'ဘဲမွေးမြူရေး',
            'duckling', 'ဘဲကလေး',
            'ducklings', 'ဘဲကလေးများ',
            'duck egg', 'ဘဲဥ',
            'duck eggs', 'ဘဲဥများ',

            # Fish / Aquaculture
            'fish', 'ငါး',
            'fishes', 'ငါးများ',
            'fish farming', 'ငါးမွေးမြူရေး',
            'fishery', 'ငါးလုပ်ငန်း',
            'aquaculture', 'ရေသတ္တဝါမွေးမြူရေး',
            'fish pond', 'ငါးကန်',
            'fish pond farming', 'ငါးကန်မွေးမြူရေး',
            'fingerling', 'ငါးသားပေါက်',
            'fingerlings', 'ငါးသားပေါက်များ',
            'fish feed', 'ငါးစာ',
            'fish breeding', 'ငါးမျိုးပွားရေး',
            'fish hatchery', 'ငါးသားဖောက်စခန်း',
            'tilapia', 'တီလာပီးယားငါး',
            'catfish', 'ငါးခူ',
            'carp', 'ငါးကြင်း',
            'rohu', 'ရိုဟူးငါး',
            'shrimp', 'ပုစွန်',
            'prawn', 'ပုစွန်',
            'crab', 'ကဏန်း',

            # Goat / Sheep
            'goat', 'ဆိတ်',
            'goats', 'ဆိတ်များ',
            'goat farming', 'ဆိတ်မွေးမြူရေး',
            'goat breeding', 'ဆိတ်မျိုးပွားရေး',
            'kid', 'ဆိတ်ကလေး',
            'kids', 'ဆိတ်ကလေးများ',
            'sheep', 'သိုး',
            'lamb', 'သိုးကလေး',
            'lambs', 'သိုးကလေးများ',
            'sheep farming', 'သိုးမွေးမြူရေး',
            'sheep breeding', 'သိုးမျိုးပွားရေး',

            # Other Animals
            'horse', 'မြင်း',
            'horses', 'မြင်းများ',
            'donkey', 'မြည်း',
            'buffalo', 'ကျွဲ',
            'buffaloes', 'ကျွဲများ',
            'rabbit', 'ယုန်',
            'rabbits', 'ယုန်များ',
            'rabbit farming', 'ယုန်မွေးမြူရေး',
            'bee', 'ပျား',
            'bees', 'ပျားများ',
            'beekeeping', 'ပျားမွေးမြူရေး',
            'honey', 'ပျားရည်',
            'honeybee', 'ပျားရည်ပျား',
            'apiculture', 'ပျားမွေးမြူရေး',

            # Feed / Nutrition
            'feed', 'အစာ',
            'feeding', 'အစာကျွေးခြင်း',
            'animal feed', 'တိရစ္ဆာန်အစာ',
            'feed supplement', 'အစာဖြည့်စွက်စာ',
            'fodder', 'တိရစ္ဆာန်အစာ',
            'grass', 'မြက်',
            'hay', 'မြက်ခြောက်',
            'silage', 'အချဉ်ဖောက်မြက်စာ',
            'protein feed', 'ပရိုတင်းအစာ',
            'nutrition', 'အာဟာရ',
            'animal nutrition', 'တိရစ္ဆာန်အာဟာရ',
            'feeding schedule', 'အစာကျွေးချိန်ဇယား',
            'feed conversion', 'အစာပြောင်းလဲနှုန်း',

            # Health / Disease
            'vaccine', 'ကာကွယ်ဆေး',
            'vaccination', 'ကာကွယ်ဆေးထိုးခြင်း',
            'vaccinate', 'ကာကွယ်ဆေးထိုးသည်',
            'veterinary', 'တိရစ္ဆာန်ဆေးကု',
            'veterinarian', 'တိရစ္ဆာန်ဆေးကုဆရာဝန်',
            'vet', 'တိရစ္ဆာန်ဆေးကုဆရာဝန်',
            'animal health', 'တိရစ္ဆာန်ကျန်းမာရေး',
            'disease', 'ရောဂါ',
            'infection', 'ကူးစက်ရောဂါ',
            'parasite', 'ကပ်ပါးပိုး',
            'parasites', 'ကပ်ပါးပိုးများ',
            'worm', 'သန်ကောင်',
            'worms', 'သန်ကောင်များ',
            'deworming', 'သန်ချဆေးတိုက်ခြင်း',
            'medicine', 'ဆေးဝါး',
            'antibiotic', 'ပဋိဇီဝဆေး',
            'biosecurity', 'ဇီဝလုံခြုံရေး',
            'outbreak', 'ရောဂါဖြစ်ပွားမှု',

            # Breeding / Production
            'breeding', 'မျိုးပွားခြင်း',
            'breed', 'မျိုးစိတ်',
            'breeder', 'မွေးမြူသူ',
            'reproduction', 'မျိုးပွားခြင်း',
            'pregnancy', 'ကိုယ်ဝန်',
            'gestation', 'ကိုယ်ဝန်ဆောင်ကာလ',
            'artificial insemination', 'သားဖောက်ခြင်း',
            'hatchery', 'သားဖောက်စခန်း',
            'hatching', 'သားဖောက်ခြင်း',
            'fertility', 'မျိုးပွားနိုင်စွမ်း',
            'milk', 'နို့',
            'milk production', 'နို့ထုတ်လုပ်မှု',
            'dairy', 'နို့ထွက်ပစ္စည်းလုပ်ငန်း',
            'meat', 'အသား',
            'meat production', 'အသားထုတ်လုပ်မှု',
            'egg production', 'ဥထုတ်လုပ်မှု'
        ]

        region_keywords = [
            # Ayeyarwady Region
            'ayeyarwady', 'ayeyarwaddy', 'irrawaddy',
            'ayeyarwady region', 'ayeyarwaddy region',
            'ဧရာဝတီ', 'ဧရာဝတီတိုင်း', 'ဧရာဝတီတိုင်းဒေသကြီး',

            # Mandalay Region
            'mandalay', 'mandalay region',
            'မန္တလေး', 'မန္တလေးတိုင်း', 'မန္တလေးတိုင်းဒေသကြီး',

            # Yangon Region
            'yangon', 'rangoon', 'yangon region',
            'ရန်ကုန်', 'ရန်ကုန်တိုင်း', 'ရန်ကုန်တိုင်းဒေသကြီး',

            # Rakhine State
            'rakhine', 'arakhan', 'rakhine state',
            'ရခိုင်', 'ရခိုင်ပြည်နယ်',

            # Kayin State
            'kayin', 'karen', 'kayin state', 'karen state',
            'ကရင်', 'ကရင်ပြည်နယ်',

            # Kayah State
            'kayah', 'kayah state', 'karenni', 'karenni state',
            'ကယား', 'ကယားပြည်နယ်',

            # Shan State
            'shan', 'shan state',
            'ရှမ်း', 'ရှမ်းပြည်နယ်',

            # Kachin State
            'kachin', 'kachin state',
            'ကချင်', 'ကချင်ပြည်နယ်',

            # Chin State
            'chin', 'chin state',
            'ချင်း', 'ချင်းပြည်နယ်',

            # Mon State
            'mon', 'mon state',
            'မွန်', 'မွန်ပြည်နယ်',

            # Magway Region
            'magway', 'magwe', 'magway region',
            'မကွေး', 'မကွေးတိုင်း', 'မကွေးတိုင်းဒေသကြီး',

            # Bago Region
            'bago', 'pegu', 'bago region',
            'ပဲခူး', 'ပဲခူးတိုင်း', 'ပဲခူးတိုင်းဒေသကြီး',

            # Sagaing Region
            'sagaing', 'sagain', 'sagaing region',
            'စစ်ကိုင်း', 'စစ်ကိုင်းတိုင်း', 'စစ်ကိုင်းတိုင်းဒေသကြီး',

            # Tanintharyi Region
            'tanintharyi', 'tenasserim', 'tanintharyi region',
            'တနင်္သာရီ', 'တနင်္သာရီတိုင်း', 'တနင်္သာရီတိုင်းဒေသကြီး',

            # Naypyidaw
            'naypyitaw', 'nay pyi taw', 'naypyidaw',
            'naypyitaw union territory',
            'နေပြည်တော်', 'နေပြည်တော်ပြည်ထောင်စုနယ်မြေ'
        ]
        
        question_lower = question.lower()
        has_farming = any(keyword in question_lower for keyword in farming_keywords)
        has_livestock = any(keyword in question_lower for keyword in livestock_keywords)
        has_region = any(keyword in question_lower for keyword in region_keywords)
        
        return has_farming or has_livestock or has_region

rag_service = RAGService()

@app.post("/chat")
async def chat(request: ChatRequest):
    """RAG chat endpoint with streaming response"""
    
    # Check domain relevance
    if not rag_service.check_domain_relevance(request.question):
        return StreamingResponse(
            iter(["I can only answer questions about farming, livestock, and breeding. Please ask a question related to agriculture or animal husbandry.\n\nကျွန်တော်သည် စိုက်ပျိုးရေး၊ မွေးမြူရေးနှင့် သားဖောက်ခြင်းဆိုင်ရာ မေးခွန်းများကိုသာ ဖြေကြားပေးနိုင်ပါသည်။ ကျေးဇူးပြု၍ စိုက်ပျိုးရေး (သို့မဟုတ်) တိရစ္ဆာန်မွေးမြူရေးနှင့် သက်ဆိုင်သော မေးခွန်းများကို မေးမြန်းပေးပါ။"]),
            media_type="text/plain"
        )
    
    # Search Qdrant for relevant context
    search_results = rag_service.search_qdrant(request.question, limit=5)
    
    if not search_results:
        return StreamingResponse(
            iter(["I couldn't find relevant information in our database about your question. Please try rephrasing or ask about specific farming/livestock topics.\n\nသင့်မေးခွန်းနှင့်ပတ်သက်သော သက်ဆိုင်ရာအချက်အလက်များကို ကျွန်ုပ်တို့၏ စနစ် (database) ထဲတွင် ရှာမတွေ့ပါ။ ကျေးဇူးပြု၍ မေးခွန်းကို အနည်းငယ် ပြင်ဆင်၍ ပြန်မေးပေးပါ (သို့မဟုတ်) တိကျသော စိုက်ပျိုးရေးနှင့် မွေးမြူရေးဆိုင်ရာ အကြောင်းအရာများကို မေးမြန်းပေးပါ။"]),
            media_type="text/plain"
        )
    
    # Build context from search results
    context_parts = []
    sources = []
    for result in search_results:
        context_parts.append(f"[{result['collection']}] {result['text']}")
        sources.append({
            'collection': result['collection'],
            'record_id': result['record_id'],
            'score': result['score'],
            'metadata': result['metadata']
        })
    
    context = "\n\n".join(context_parts)
    
    # Generate streaming response
    def generate():
        for chunk in rag_service.generate_response_stream(
            request.question, 
            context, 
            request.conversation_history
        ):
            yield chunk
        
        # Send sources metadata after response is complete
        yield f"\n\n[SOURCES]\n{json.dumps(sources)}\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain"
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RAG Chat Service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
