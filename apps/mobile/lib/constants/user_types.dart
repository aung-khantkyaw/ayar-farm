class UserTypes {
  static const String admin = 'ADMIN';
  static const String farmer = 'FARMER';
  static const String agriculturalSpecialist = 'AGRICULTURAL_SPECIALIST';
  static const String agriculturalEquipmentShop = 'AGRICULTURAL_EQUIPMENT_SHOP';
  static const String traderVendor = 'TRADER_VENDOR';
  static const String livestockBreeder = 'LIVESTOCK_BREEDER';
  static const String livestockSpecialist = 'LIVESTOCK_SPECIALIST';
  static const String others = 'OTHERS';
}

const Map<String, String> userTypeLabels = {
  UserTypes.farmer: 'လယ်သမား',
  UserTypes.agriculturalSpecialist: 'စိုက်ပျိုးရေးကျွမ်းကျင်သူ',
  UserTypes.agriculturalEquipmentShop: 'စိုက်ပျိုးရေးကိရိယာဆိုင်',
  UserTypes.traderVendor: 'ကုန်သည်/ရောင်းချသူ',
  UserTypes.livestockBreeder: 'မွေးမြူရေးလုပ်ငန်းရှင်',
  UserTypes.livestockSpecialist: 'မွေးမြူရေးကျွမ်းကျင်သူ',
  UserTypes.others: 'အခြား',
};
