import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_my.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('my'),
  ];

  /// The conventional newborn programmer greeting
  ///
  /// In en, this message translates to:
  /// **'Hello World!'**
  String get helloWorld;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Ayar Farm Link'**
  String get appTitle;

  /// No description provided for @pushedButtonMessage.
  ///
  /// In en, this message translates to:
  /// **'You have pushed the button this many times:'**
  String get pushedButtonMessage;

  /// No description provided for @increment.
  ///
  /// In en, this message translates to:
  /// **'Increment'**
  String get increment;

  /// No description provided for @crops.
  ///
  /// In en, this message translates to:
  /// **'Crops'**
  String get crops;

  /// No description provided for @livestocks.
  ///
  /// In en, this message translates to:
  /// **'Livestocks'**
  String get livestocks;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Cultivate Knowledge.\nGrow Together.'**
  String get welcomeSubtitle;

  /// No description provided for @createNewAccount.
  ///
  /// In en, this message translates to:
  /// **'Create New Account'**
  String get createNewAccount;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @termsAgreementPrefix.
  ///
  /// In en, this message translates to:
  /// **'By joining, you agree to our '**
  String get termsAgreementPrefix;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @and.
  ///
  /// In en, this message translates to:
  /// **' and '**
  String get and;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @loginSuccessful.
  ///
  /// In en, this message translates to:
  /// **'Login successful!'**
  String get loginSuccessful;

  /// No description provided for @errorOccurred.
  ///
  /// In en, this message translates to:
  /// **'An error occurred'**
  String get errorOccurred;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBack;

  /// No description provided for @connectWithCommunity.
  ///
  /// In en, this message translates to:
  /// **'Connect with the farming community.'**
  String get connectWithCommunity;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumber;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @mobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile Number'**
  String get mobileNumber;

  /// No description provided for @emailAddress.
  ///
  /// In en, this message translates to:
  /// **'Email Address'**
  String get emailAddress;

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get required;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @forgot.
  ///
  /// In en, this message translates to:
  /// **'Forgot?'**
  String get forgot;

  /// No description provided for @enterPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get enterPassword;

  /// No description provided for @logIn.
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get logIn;

  /// No description provided for @newHere.
  ///
  /// In en, this message translates to:
  /// **'New here? '**
  String get newHere;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create an Account'**
  String get createAccount;

  /// No description provided for @passwordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordsDoNotMatch;

  /// No description provided for @registrationFailed.
  ///
  /// In en, this message translates to:
  /// **'Registration failed: '**
  String get registrationFailed;

  /// No description provided for @joinCommunity.
  ///
  /// In en, this message translates to:
  /// **'Join the Community'**
  String get joinCommunity;

  /// No description provided for @connectWithFarmers.
  ///
  /// In en, this message translates to:
  /// **'Connect with farmers, experts, and traders worldwide.'**
  String get connectWithFarmers;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// No description provided for @enterFullName.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get enterFullName;

  /// No description provided for @phonePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'+1 (555) 000-0000'**
  String get phonePlaceholder;

  /// No description provided for @emailPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'you@example.com'**
  String get emailPlaceholder;

  /// No description provided for @iAmA.
  ///
  /// In en, this message translates to:
  /// **'I am a...'**
  String get iAmA;

  /// No description provided for @passwordPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'••••••••'**
  String get passwordPlaceholder;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPassword;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? '**
  String get alreadyHaveAccount;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get navCategory;

  /// No description provided for @navChatting.
  ///
  /// In en, this message translates to:
  /// **'Chatting'**
  String get navChatting;

  /// No description provided for @navSetting.
  ///
  /// In en, this message translates to:
  /// **'Setting'**
  String get navSetting;

  /// No description provided for @locationDisabled.
  ///
  /// In en, this message translates to:
  /// **'Location services are disabled.'**
  String get locationDisabled;

  /// No description provided for @locationDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permissions are denied'**
  String get locationDenied;

  /// No description provided for @locationPermanentlyDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permissions are permanently denied, we cannot request permissions.'**
  String get locationPermanentlyDenied;

  /// No description provided for @weatherLoadFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed to load weather data'**
  String get weatherLoadFailed;

  /// No description provided for @weatherError.
  ///
  /// In en, this message translates to:
  /// **'Error getting location or weather: '**
  String get weatherError;

  /// No description provided for @weatherUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Weather unavailable'**
  String get weatherUnavailable;

  /// No description provided for @currentLocation.
  ///
  /// In en, this message translates to:
  /// **'Current Location'**
  String get currentLocation;

  /// No description provided for @searchPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search crops, pests, advice...'**
  String get searchPlaceholder;

  /// No description provided for @catAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get catAll;

  /// No description provided for @catPestControl.
  ///
  /// In en, this message translates to:
  /// **'Pest Control'**
  String get catPestControl;

  /// No description provided for @catIrrigation.
  ///
  /// In en, this message translates to:
  /// **'Irrigation'**
  String get catIrrigation;

  /// No description provided for @catOrganic.
  ///
  /// In en, this message translates to:
  /// **'Organic'**
  String get catOrganic;

  /// No description provided for @catLivestock.
  ///
  /// In en, this message translates to:
  /// **'Livestock'**
  String get catLivestock;

  /// No description provided for @communityFeed.
  ///
  /// In en, this message translates to:
  /// **'Community Feed'**
  String get communityFeed;

  /// No description provided for @comments.
  ///
  /// In en, this message translates to:
  /// **'Comments'**
  String get comments;

  /// No description provided for @knowledgeBase.
  ///
  /// In en, this message translates to:
  /// **'Knowledge Base'**
  String get knowledgeBase;

  /// No description provided for @farmingGuides.
  ///
  /// In en, this message translates to:
  /// **'Farming guides'**
  String get farmingGuides;

  /// No description provided for @animalHusbandry.
  ///
  /// In en, this message translates to:
  /// **'Animal husbandry'**
  String get animalHusbandry;

  /// No description provided for @fishery.
  ///
  /// In en, this message translates to:
  /// **'Fishery'**
  String get fishery;

  /// No description provided for @aquacultureTips.
  ///
  /// In en, this message translates to:
  /// **'Aquaculture tips'**
  String get aquacultureTips;

  /// No description provided for @agriIndustry.
  ///
  /// In en, this message translates to:
  /// **'Agri Industry'**
  String get agriIndustry;

  /// No description provided for @industrialTech.
  ///
  /// In en, this message translates to:
  /// **'Industrial tech'**
  String get industrialTech;

  /// No description provided for @toolsUtilities.
  ///
  /// In en, this message translates to:
  /// **'Tools & Utilities'**
  String get toolsUtilities;

  /// No description provided for @agriCalculator.
  ///
  /// In en, this message translates to:
  /// **'Agri Calculator'**
  String get agriCalculator;

  /// No description provided for @calculatorDesc.
  ///
  /// In en, this message translates to:
  /// **'Calculate crop yields, fertilizer needs, and profits instantly.'**
  String get calculatorDesc;

  /// No description provided for @dailyInsights.
  ///
  /// In en, this message translates to:
  /// **'Daily Insights'**
  String get dailyInsights;

  /// No description provided for @weather.
  ///
  /// In en, this message translates to:
  /// **'Weather'**
  String get weather;

  /// No description provided for @marketPrice.
  ///
  /// In en, this message translates to:
  /// **'Market Price'**
  String get marketPrice;

  /// No description provided for @subcategories.
  ///
  /// In en, this message translates to:
  /// **'subcategories'**
  String get subcategories;

  /// No description provided for @subcategory.
  ///
  /// In en, this message translates to:
  /// **'subcategory'**
  String get subcategory;

  /// No description provided for @cropTypesTitle.
  ///
  /// In en, this message translates to:
  /// **'Crop Types'**
  String get cropTypesTitle;

  /// No description provided for @noCropTypes.
  ///
  /// In en, this message translates to:
  /// **'No crop types available'**
  String get noCropTypes;

  /// No description provided for @goodDayForSowingWheat.
  ///
  /// In en, this message translates to:
  /// **'Good day for sowing wheat.'**
  String get goodDayForSowingWheat;

  /// No description provided for @unknown.
  ///
  /// In en, this message translates to:
  /// **'Unknown'**
  String get unknown;

  /// No description provided for @searchFarmersPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search farmers or topics...'**
  String get searchFarmersPlaceholder;

  /// No description provided for @groups.
  ///
  /// In en, this message translates to:
  /// **'Groups'**
  String get groups;

  /// No description provided for @mentors.
  ///
  /// In en, this message translates to:
  /// **'Mentors'**
  String get mentors;

  /// No description provided for @sentAnImage.
  ///
  /// In en, this message translates to:
  /// **'Sent an image'**
  String get sentAnImage;

  /// No description provided for @failedToLoadCropTypes.
  ///
  /// In en, this message translates to:
  /// **'Failed to load crop types: '**
  String get failedToLoadCropTypes;

  /// No description provided for @errorLoadingCropTypes.
  ///
  /// In en, this message translates to:
  /// **'Error loading crop types: '**
  String get errorLoadingCropTypes;

  /// No description provided for @failedToLoadCrops.
  ///
  /// In en, this message translates to:
  /// **'Failed to load crops: '**
  String get failedToLoadCrops;

  /// No description provided for @errorLoadingCrops.
  ///
  /// In en, this message translates to:
  /// **'Error loading crops: '**
  String get errorLoadingCrops;

  /// No description provided for @failedToLoadLivestock.
  ///
  /// In en, this message translates to:
  /// **'Failed to load livestock: '**
  String get failedToLoadLivestock;

  /// No description provided for @errorLoadingLivestock.
  ///
  /// In en, this message translates to:
  /// **'Error loading livestock: '**
  String get errorLoadingLivestock;

  /// No description provided for @fish.
  ///
  /// In en, this message translates to:
  /// **'Fish'**
  String get fish;

  /// No description provided for @failedToLoadFish.
  ///
  /// In en, this message translates to:
  /// **'Failed to load fish: '**
  String get failedToLoadFish;

  /// No description provided for @errorLoadingFish.
  ///
  /// In en, this message translates to:
  /// **'Error loading fish: '**
  String get errorLoadingFish;

  /// No description provided for @machineTypes.
  ///
  /// In en, this message translates to:
  /// **'Machine Types'**
  String get machineTypes;

  /// No description provided for @failedToLoadMachineTypes.
  ///
  /// In en, this message translates to:
  /// **'Failed to load machine types: '**
  String get failedToLoadMachineTypes;

  /// No description provided for @errorLoadingMachineTypes.
  ///
  /// In en, this message translates to:
  /// **'Error loading machine types: '**
  String get errorLoadingMachineTypes;

  /// No description provided for @machines.
  ///
  /// In en, this message translates to:
  /// **'Machines'**
  String get machines;

  /// No description provided for @failedToLoadMachines.
  ///
  /// In en, this message translates to:
  /// **'Failed to load machines: '**
  String get failedToLoadMachines;

  /// No description provided for @errorLoadingMachines.
  ///
  /// In en, this message translates to:
  /// **'Error loading machines: '**
  String get errorLoadingMachines;

  /// No description provided for @cropDocuments.
  ///
  /// In en, this message translates to:
  /// **'Crop Documents'**
  String get cropDocuments;

  /// No description provided for @fishDocuments.
  ///
  /// In en, this message translates to:
  /// **'Fish Documents'**
  String get fishDocuments;

  /// No description provided for @livestockDocuments.
  ///
  /// In en, this message translates to:
  /// **'Livestock Documents'**
  String get livestockDocuments;

  /// No description provided for @machineDocuments.
  ///
  /// In en, this message translates to:
  /// **'Machine Documents'**
  String get machineDocuments;

  /// No description provided for @documents.
  ///
  /// In en, this message translates to:
  /// **'Documents'**
  String get documents;

  /// No description provided for @noDocumentsAvailable.
  ///
  /// In en, this message translates to:
  /// **'No documents available'**
  String get noDocumentsAvailable;

  /// No description provided for @anonymous.
  ///
  /// In en, this message translates to:
  /// **'Anonymous'**
  String get anonymous;

  /// No description provided for @cannotOpenPdfInBrowser.
  ///
  /// In en, this message translates to:
  /// **'Cannot open PDF in browser'**
  String get cannotOpenPdfInBrowser;

  /// No description provided for @failedToOpenPdf.
  ///
  /// In en, this message translates to:
  /// **'Failed to open PDF: '**
  String get failedToOpenPdf;

  /// No description provided for @failedToLoadPdf.
  ///
  /// In en, this message translates to:
  /// **'Failed to load PDF: '**
  String get failedToLoadPdf;

  /// No description provided for @openingPdfInBrowser.
  ///
  /// In en, this message translates to:
  /// **'Opening PDF in browser...'**
  String get openingPdfInBrowser;

  /// No description provided for @loadingPdf.
  ///
  /// In en, this message translates to:
  /// **'Loading PDF...'**
  String get loadingPdf;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @weatherForecast.
  ///
  /// In en, this message translates to:
  /// **'Weather Forecast'**
  String get weatherForecast;

  /// No description provided for @navCommunity.
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get navCommunity;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @area.
  ///
  /// In en, this message translates to:
  /// **'Area'**
  String get area;

  /// No description provided for @weight.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get weight;

  /// No description provided for @temperature.
  ///
  /// In en, this message translates to:
  /// **'Temperature'**
  String get temperature;

  /// No description provided for @liquid.
  ///
  /// In en, this message translates to:
  /// **'Liquid'**
  String get liquid;

  /// No description provided for @hectare.
  ///
  /// In en, this message translates to:
  /// **'Hectare'**
  String get hectare;

  /// No description provided for @acre.
  ///
  /// In en, this message translates to:
  /// **'Acre'**
  String get acre;

  /// No description provided for @sqMeter.
  ///
  /// In en, this message translates to:
  /// **'Sq Meter'**
  String get sqMeter;

  /// No description provided for @sqFoot.
  ///
  /// In en, this message translates to:
  /// **'Sq Foot'**
  String get sqFoot;

  /// No description provided for @kg.
  ///
  /// In en, this message translates to:
  /// **'Kg'**
  String get kg;

  /// No description provided for @lb.
  ///
  /// In en, this message translates to:
  /// **'Lb'**
  String get lb;

  /// No description provided for @ton.
  ///
  /// In en, this message translates to:
  /// **'Ton'**
  String get ton;

  /// No description provided for @gram.
  ///
  /// In en, this message translates to:
  /// **'Gram'**
  String get gram;

  /// No description provided for @celsius.
  ///
  /// In en, this message translates to:
  /// **'Celsius'**
  String get celsius;

  /// No description provided for @fahrenheit.
  ///
  /// In en, this message translates to:
  /// **'Fahrenheit'**
  String get fahrenheit;

  /// No description provided for @kelvin.
  ///
  /// In en, this message translates to:
  /// **'Kelvin'**
  String get kelvin;

  /// No description provided for @liter.
  ///
  /// In en, this message translates to:
  /// **'Liter'**
  String get liter;

  /// No description provided for @gallon.
  ///
  /// In en, this message translates to:
  /// **'Gallon'**
  String get gallon;

  /// No description provided for @milliliter.
  ///
  /// In en, this message translates to:
  /// **'Milliliter'**
  String get milliliter;

  /// No description provided for @unitConverter.
  ///
  /// In en, this message translates to:
  /// **'Unit Converter'**
  String get unitConverter;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @from.
  ///
  /// In en, this message translates to:
  /// **'FROM'**
  String get from;

  /// No description provided for @to.
  ///
  /// In en, this message translates to:
  /// **'TO'**
  String get to;

  /// No description provided for @marketPrices.
  ///
  /// In en, this message translates to:
  /// **'Market Prices'**
  String get marketPrices;

  /// No description provided for @searchMarketPrices.
  ///
  /// In en, this message translates to:
  /// **'Search Market Prices'**
  String get searchMarketPrices;

  /// No description provided for @pricesFor.
  ///
  /// In en, this message translates to:
  /// **'Prices for '**
  String get pricesFor;

  /// No description provided for @pricesForToday.
  ///
  /// In en, this message translates to:
  /// **'Prices for Today, '**
  String get pricesForToday;

  /// No description provided for @dataDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Data Disclaimer'**
  String get dataDisclaimer;

  /// No description provided for @productHeader.
  ///
  /// In en, this message translates to:
  /// **'PRODUCT'**
  String get productHeader;

  /// No description provided for @unitHeader.
  ///
  /// In en, this message translates to:
  /// **'UNIT'**
  String get unitHeader;

  /// No description provided for @priceHeader.
  ///
  /// In en, this message translates to:
  /// **'PRICE (MMK)'**
  String get priceHeader;

  /// No description provided for @selectRegion.
  ///
  /// In en, this message translates to:
  /// **'Select Region'**
  String get selectRegion;

  /// No description provided for @allRegions.
  ///
  /// In en, this message translates to:
  /// **'All Regions'**
  String get allRegions;

  /// No description provided for @selectProductType.
  ///
  /// In en, this message translates to:
  /// **'Select Product Type'**
  String get selectProductType;

  /// No description provided for @allProductTypes.
  ///
  /// In en, this message translates to:
  /// **'All Product Types'**
  String get allProductTypes;

  /// No description provided for @selectMarket.
  ///
  /// In en, this message translates to:
  /// **'Select Market'**
  String get selectMarket;

  /// No description provided for @allMarkets.
  ///
  /// In en, this message translates to:
  /// **'All Markets'**
  String get allMarkets;

  /// No description provided for @selectDate.
  ///
  /// In en, this message translates to:
  /// **'Select Date'**
  String get selectDate;

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @failedToLoadMarketData.
  ///
  /// In en, this message translates to:
  /// **'Failed to load market data'**
  String get failedToLoadMarketData;

  /// No description provided for @noMarketDataFound.
  ///
  /// In en, this message translates to:
  /// **'No Market Data Found'**
  String get noMarketDataFound;

  /// No description provided for @marketDataEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Try selecting a different region or product type to see available prices.'**
  String get marketDataEmptyMessage;

  /// No description provided for @unknownMarket.
  ///
  /// In en, this message translates to:
  /// **'Unknown Market'**
  String get unknownMarket;

  /// No description provided for @marketRegion.
  ///
  /// In en, this message translates to:
  /// **'Market Region'**
  String get marketRegion;

  /// No description provided for @marketDisclaimerText.
  ///
  /// In en, this message translates to:
  /// **'Prices are updated daily. Actual transaction prices may vary slightly.'**
  String get marketDisclaimerText;

  /// No description provided for @viewAllItems.
  ///
  /// In en, this message translates to:
  /// **'View all {count} items'**
  String viewAllItems(int count);

  /// No description provided for @enterEmailOrPhone.
  ///
  /// In en, this message translates to:
  /// **'Please enter your email or phone number'**
  String get enterEmailOrPhone;

  /// No description provided for @resetCodeSent.
  ///
  /// In en, this message translates to:
  /// **'Reset code sent successfully'**
  String get resetCodeSent;

  /// No description provided for @failedToSendResetCode.
  ///
  /// In en, this message translates to:
  /// **'Failed to send reset code: '**
  String get failedToSendResetCode;

  /// No description provided for @resetPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPasswordTitle;

  /// No description provided for @resetPasswordSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Don\'t worry, it happens. Please enter the address associated with your account.'**
  String get resetPasswordSubtitle;

  /// No description provided for @emailOrPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Email or Phone Number'**
  String get emailOrPhoneLabel;

  /// No description provided for @emailOrPhonePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'john@example.com or +1 555...'**
  String get emailOrPhonePlaceholder;

  /// No description provided for @sendResetCode.
  ///
  /// In en, this message translates to:
  /// **'Send Reset Code'**
  String get sendResetCode;

  /// No description provided for @rememberPassword.
  ///
  /// In en, this message translates to:
  /// **'Remember your password? '**
  String get rememberPassword;

  /// No description provided for @needMoreHelp.
  ///
  /// In en, this message translates to:
  /// **'Need more help?'**
  String get needMoreHelp;

  /// No description provided for @resetCodeResent.
  ///
  /// In en, this message translates to:
  /// **'Reset code resent successfully'**
  String get resetCodeResent;

  /// No description provided for @failedToResendResetCode.
  ///
  /// In en, this message translates to:
  /// **'Failed to resend reset code: '**
  String get failedToResendResetCode;

  /// No description provided for @enterSixDigitCode.
  ///
  /// In en, this message translates to:
  /// **'Please enter the 6-digit code'**
  String get enterSixDigitCode;

  /// No description provided for @enterNewPassword.
  ///
  /// In en, this message translates to:
  /// **'Please enter a new password'**
  String get enterNewPassword;

  /// No description provided for @passwordUpdated.
  ///
  /// In en, this message translates to:
  /// **'Password updated successfully'**
  String get passwordUpdated;

  /// No description provided for @failedToUpdatePassword.
  ///
  /// In en, this message translates to:
  /// **'Failed to update password: '**
  String get failedToUpdatePassword;

  /// No description provided for @verifyAndReset.
  ///
  /// In en, this message translates to:
  /// **'Verify & Reset'**
  String get verifyAndReset;

  /// No description provided for @verifyAndResetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the code sent to {identifier} and set a new password.'**
  String verifyAndResetSubtitle(String identifier);

  /// No description provided for @verificationCode.
  ///
  /// In en, this message translates to:
  /// **'Verification Code'**
  String get verificationCode;

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend Code'**
  String get resendCode;

  /// No description provided for @enterSixDigitCodeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to your phone.'**
  String get enterSixDigitCodeSubtitle;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPassword;

  /// No description provided for @passwordMinLength.
  ///
  /// In en, this message translates to:
  /// **'Must be at least 8 characters'**
  String get passwordMinLength;

  /// No description provided for @confirmNewPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm New Password'**
  String get confirmNewPassword;

  /// No description provided for @reEnterPassword.
  ///
  /// In en, this message translates to:
  /// **'Re-enter your password'**
  String get reEnterPassword;

  /// No description provided for @updatePassword.
  ///
  /// In en, this message translates to:
  /// **'Update Password'**
  String get updatePassword;

  /// No description provided for @contactSupport.
  ///
  /// In en, this message translates to:
  /// **'Need help? Contact Support'**
  String get contactSupport;

  /// No description provided for @verificationFailed.
  ///
  /// In en, this message translates to:
  /// **'Verification failed: '**
  String get verificationFailed;

  /// No description provided for @otpResent.
  ///
  /// In en, this message translates to:
  /// **'OTP resent successfully'**
  String get otpResent;

  /// No description provided for @failedToResendOtp.
  ///
  /// In en, this message translates to:
  /// **'Failed to resend OTP: '**
  String get failedToResendOtp;

  /// No description provided for @yourAccount.
  ///
  /// In en, this message translates to:
  /// **'your account'**
  String get yourAccount;

  /// No description provided for @verifyItsYou.
  ///
  /// In en, this message translates to:
  /// **'Verify it\'s you'**
  String get verifyItsYou;

  /// No description provided for @enterCodeSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to'**
  String get enterCodeSentTo;

  /// No description provided for @didntReceiveCode.
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive the code?'**
  String get didntReceiveCode;

  /// No description provided for @confirmAndContinue.
  ///
  /// In en, this message translates to:
  /// **'Confirm & Continue'**
  String get confirmAndContinue;

  /// No description provided for @settingScreen.
  ///
  /// In en, this message translates to:
  /// **'Setting Screen'**
  String get settingScreen;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @accountSection.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountSection;

  /// No description provided for @personalInformation.
  ///
  /// In en, this message translates to:
  /// **'Personal Information'**
  String get personalInformation;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get changePassword;

  /// No description provided for @linkedAccounts.
  ///
  /// In en, this message translates to:
  /// **'Linked Accounts'**
  String get linkedAccounts;

  /// No description provided for @preferencesSection.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferencesSection;

  /// No description provided for @pushNotifications.
  ///
  /// In en, this message translates to:
  /// **'Push Notifications'**
  String get pushNotifications;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// No description provided for @supportPrivacySection.
  ///
  /// In en, this message translates to:
  /// **'Support & Privacy'**
  String get supportPrivacySection;

  /// No description provided for @helpCenter.
  ///
  /// In en, this message translates to:
  /// **'Help Center'**
  String get helpCenter;

  /// No description provided for @reportBug.
  ///
  /// In en, this message translates to:
  /// **'Report a Bug'**
  String get reportBug;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @changeProfilePhoto.
  ///
  /// In en, this message translates to:
  /// **'Change Profile Photo'**
  String get changeProfilePhoto;

  /// No description provided for @enterPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number'**
  String get enterPhoneNumber;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @selectGender.
  ///
  /// In en, this message translates to:
  /// **'Select Gender'**
  String get selectGender;

  /// No description provided for @male.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get male;

  /// No description provided for @female.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get female;

  /// No description provided for @other.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get other;

  /// No description provided for @userType.
  ///
  /// In en, this message translates to:
  /// **'User Type'**
  String get userType;

  /// No description provided for @selectUserType.
  ///
  /// In en, this message translates to:
  /// **'Select User Type'**
  String get selectUserType;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @selectState.
  ///
  /// In en, this message translates to:
  /// **'Select State'**
  String get selectState;

  /// No description provided for @selectTownship.
  ///
  /// In en, this message translates to:
  /// **'Select Township'**
  String get selectTownship;

  /// No description provided for @enterAddress.
  ///
  /// In en, this message translates to:
  /// **'Enter your address'**
  String get enterAddress;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get saveChanges;

  /// No description provided for @changesSaved.
  ///
  /// In en, this message translates to:
  /// **'Changes saved!'**
  String get changesSaved;

  /// No description provided for @errorLoadingTownships.
  ///
  /// In en, this message translates to:
  /// **'Error loading townships: '**
  String get errorLoadingTownships;

  /// No description provided for @enterEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'Enter your email address'**
  String get enterEmailAddress;

  /// No description provided for @userTypeFarmer.
  ///
  /// In en, this message translates to:
  /// **'Farmer'**
  String get userTypeFarmer;

  /// No description provided for @userTypeAgriSpecialist.
  ///
  /// In en, this message translates to:
  /// **'Agricultural Specialist'**
  String get userTypeAgriSpecialist;

  /// No description provided for @userTypeAgriEquipShop.
  ///
  /// In en, this message translates to:
  /// **'Agricultural Equipment Shop'**
  String get userTypeAgriEquipShop;

  /// No description provided for @userTypeTrader.
  ///
  /// In en, this message translates to:
  /// **'Trader/Vendor'**
  String get userTypeTrader;

  /// No description provided for @userTypeLivestockBreeder.
  ///
  /// In en, this message translates to:
  /// **'Livestock Breeder'**
  String get userTypeLivestockBreeder;

  /// No description provided for @userTypeLivestockSpecialist.
  ///
  /// In en, this message translates to:
  /// **'Livestock Specialist'**
  String get userTypeLivestockSpecialist;

  /// No description provided for @userTypeOthers.
  ///
  /// In en, this message translates to:
  /// **'Others'**
  String get userTypeOthers;

  /// No description provided for @loadingTownships.
  ///
  /// In en, this message translates to:
  /// **'Loading Townships...'**
  String get loadingTownships;

  /// No description provided for @searchConversations.
  ///
  /// In en, this message translates to:
  /// **'Search conversations...'**
  String get searchConversations;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'my'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'my':
      return AppLocalizationsMy();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
