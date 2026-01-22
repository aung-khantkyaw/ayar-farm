import 'dart:convert';
import 'dart:io';
import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../constants/user_types.dart';
import '../services/auth_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();

  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  String? _selectedGender;
  String? _selectedUserType;

  // Location State
  static const List<Map<String, dynamic>> _states = [
    {
      "id": "bTuNIfLfchNvk1N_",
      "code": "KACHIN",
      "number": {"en": "1", "mm": "၁"},
      "name": {"en": "KACHIN", "mm": "ကချင်"},
    },
    {
      "id": "ta4SEQoCI0DVTK2T",
      "code": "KAYAH",
      "number": {"en": "2", "mm": "၂"},
      "name": {"en": "KAYAH", "mm": "ကယား"},
    },
    {
      "id": "1dzIVEs684iyjetc",
      "code": "KAYIN",
      "number": {"en": "3", "mm": "၃"},
      "name": {"en": "KAYIN", "mm": "ကရင်"},
    },
    {
      "id": "aVHfHbYrrdNZu9bW",
      "code": "CHIN",
      "number": {"en": "4", "mm": "၄"},
      "name": {"en": "CHIN", "mm": "ချင်း"},
    },
    {
      "id": "EbUz7oziqo6OB5pL",
      "code": "SAGAING",
      "number": {"en": "5", "mm": "၅"},
      "name": {"en": "SAGAING", "mm": "စစ်ကိုင်း"},
    },
    {
      "id": "X8rt_XwuTgAggCju",
      "code": "TANINTHARYI",
      "number": {"en": "6", "mm": "၆"},
      "name": {"en": "TANINTHARYI", "mm": "တနသာရီ"},
    },
    {
      "id": "zBMPM_jGuwbus35I",
      "code": "BAGO",
      "number": {"en": "7", "mm": "၇"},
      "name": {"en": "BAGO", "mm": "ပဲခူး"},
    },
    {
      "id": "u431U0SGuX9lkur-",
      "code": "MAGWE",
      "number": {"en": "8", "mm": "၈"},
      "name": {"en": "MAGWE", "mm": "မကွေး"},
    },
    {
      "id": "5PflwjWItczLTOof",
      "code": "MANDALAY",
      "number": {"en": "9", "mm": "၉"},
      "name": {"en": "MANDALAY", "mm": "မန္တလေး"},
    },
    {
      "id": "uQgglJ-AhohYQJNB",
      "code": "MON",
      "number": {"en": "10", "mm": "၁၀"},
      "name": {"en": "MON", "mm": "မွန်"},
    },
    {
      "id": "OfeDuBL9FsUHKi8j",
      "code": "RAKHINE",
      "number": {"en": "11", "mm": "၁၁"},
      "name": {"en": "RAKHINE", "mm": "ရခိုင်"},
    },
    {
      "id": "Zvxm3m8cAwCeDgz1",
      "code": "YANGON",
      "number": {"en": "12", "mm": "၁၂"},
      "name": {"en": "YANGON", "mm": "ရန်ကုန်"},
    },
    {
      "id": "DZ1kOrvrt-7LntG4",
      "code": "SHAN",
      "number": {"en": "13", "mm": "၁၃"},
      "name": {"en": "SHAN", "mm": "ရှမ်း"},
    },
    {
      "id": "tY793VdREy9r5xsl",
      "code": "AYEYAWADY",
      "number": {"en": "14", "mm": "၁၄"},
      "name": {"en": "AYEYAWADY", "mm": "ဧရာ၀တီ"},
    },
    {
      "id": "sH0ybsmxNuxmeOT_",
      "code": "NAYPYITAW",
      "number": {"en": "9*", "mm": "၉*"},
      "name": {"en": "NAYPYITAW", "mm": "နေပြည်တော်"},
    },
  ];
  List<dynamic> _townships = [];
  String? _selectedStateId;
  String? _selectedStateNumber; // Needed for fetching townships
  String? _selectedTownshipId;

  bool _isLoadingTownships = false;

  // Colors from HTML
  static const _primaryColor = Color(0xFF2BEE5B);
  static const _bgLight = Color(0xFFF6F8F6);
  static const _bgDark = Color(0xFF102215);
  static const _textLight = Color(0xFF111813);

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1000,
        maxHeight: 1000,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      CommonSnackbar.show(
        context,
        message: 'Error picking image: $e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
    }
  }

  void _loadUserData() {
    final user = AuthService.currentUser;
    if (user != null) {
      _nameController.text = user.name ?? '';
      _phoneController.text = user.phoneNumber ?? '';
      _emailController.text = user.email ?? '';
      _addressController.text = user.location ?? '';

      // Validate gender - ensure it matches dropdown items
      if (['MALE', 'FEMALE', 'OTHER'].contains(user.gender)) {
        _selectedGender = user.gender;
      } else {
        _selectedGender = null;
      }

      // Validate user type - ensure it matches dropdown items (excludes ADMIN, etc if not in list)
      final validUserTypes = [
        UserTypes.farmer,
        UserTypes.agriculturalSpecialist,
        UserTypes.agriculturalEquipmentShop,
        UserTypes.traderVendor,
        UserTypes.livestockBreeder,
        UserTypes.livestockSpecialist,
        UserTypes.others,
      ];

      if (validUserTypes.contains(user.userType)) {
        _selectedUserType = user.userType;
      } else {
        _selectedUserType = null;
      }
    }
  }

  Future<void> _fetchTownships(String stateNumber) async {
    setState(() {
      _isLoadingTownships = true;
      _townships = [];
      _selectedTownshipId = null;
    });
    try {
      final response = await http.get(
        Uri.parse(
          'https://myanmaridentityapi.laziestant.tech/v1/states/number/$stateNumber/townships',
        ),
      );
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _townships = json.decode(response.body);
          });
        }
      } else {
        debugPrint('Failed to load townships: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching townships: $e');
      if (mounted) {
        CommonSnackbar.show(
          context,
          message: '${AppLocalizations.of(context)!.errorLoadingTownships}$e',
          type: SnackBarType.error,
          position: SnackBarPosition.bottom,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingTownships = false);
      }
    }
  }

  Future<void> _onSave() async {
    final currentLocale = Localizations.localeOf(context).languageCode;
    final dataLocale = currentLocale == 'my' ? 'mm' : 'en';

    // Find selected state and township names for concatenation
    final stateObj =
        _states.where((s) => s['id'] == _selectedStateId).firstOrNull;
    final townshipObj =
        _townships.where((t) => t['id'] == _selectedTownshipId).firstOrNull;

    final stateName =
        stateObj != null
            ? (stateObj['name'][dataLocale] ?? stateObj['name']['en'])
            : '';
    final townshipName =
        townshipObj != null
            ? (townshipObj['name'][dataLocale] ?? townshipObj['name']['en'])
            : '';
    final address = _addressController.text;

    // Concatenate location
    final locationParts = [
      address,
      townshipName,
      stateName,
    ].where((s) => s.isNotEmpty).join(', ');

    final output = {
      'name': _nameController.text,
      'phone_number': _phoneController.text,
      'email': _emailController.text,
      'gender': _selectedGender,
      'user_type': _selectedUserType,
      'address': address,
      'state': stateName,
      'township': townshipName,
      'location': locationParts,
    };

    try {
      final resp = await AuthService.updateAccount(
        output,
        profilePicturePath: _imageFile?.path,
      );

      // Update locally cached session data so the app reflects new profile info
      if (resp.token != null && resp.user != null) {
        await AuthService.saveSession(resp.token!, resp.user!);
      } else if (resp.user != null) {
        await AuthService.persistUser(resp.user!);
      }

      if (mounted) {
        CommonSnackbar.show(
          context,
          message: AppLocalizations.of(context)!.changesSaved,
          type: SnackBarType.info,
          position: SnackBarPosition.bottom,
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        CommonSnackbar.show(
          context,
          message: 'Error updating profile: $e',
          type: SnackBarType.error,
          position: SnackBarPosition.bottom,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = Localizations.localeOf(context).languageCode;
    final dataLocale = currentLocale == 'my' ? 'mm' : 'en';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? _bgDark : _bgLight;
    final textColor = isDark ? Colors.white : _textLight;
    final inputBgColor = isDark ? Colors.grey[800]! : Colors.white;
    final borderColor = isDark ? Colors.grey[700]! : Colors.grey[200]!;

    final userTypeMap = {
      UserTypes.farmer: l10n.userTypeFarmer,
      UserTypes.agriculturalSpecialist: l10n.userTypeAgriSpecialist,
      UserTypes.agriculturalEquipmentShop: l10n.userTypeAgriEquipShop,
      UserTypes.traderVendor: l10n.userTypeTrader,
      UserTypes.livestockBreeder: l10n.userTypeLivestockBreeder,
      UserTypes.livestockSpecialist: l10n.userTypeLivestockSpecialist,
      UserTypes.others: l10n.userTypeOthers,
    };

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: bgColor.withOpacity(0.95),
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? Colors.transparent : Colors.transparent,
                      ),
                      child: Icon(
                        Icons.arrow_back_ios_new,
                        color: textColor,
                        size: 20,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      l10n.editProfile,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 40), // Balance the back button
                ],
              ),
            ),

            // Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // Profile Photo
                  Center(
                    child: Column(
                      children: [
                        GestureDetector(
                          onTap: _pickImage,
                          child: Stack(
                            children: [
                              Container(
                                width: 128,
                                height: 128,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color:
                                        isDark
                                            ? Colors.grey[800]!
                                            : Colors.white,
                                    width: 4,
                                  ),
                                  image: DecorationImage(
                                    image:
                                        _imageFile != null
                                            ? FileImage(_imageFile!)
                                                as ImageProvider
                                            : NetworkImage(
                                              AuthService
                                                      .currentUser
                                                      ?.profilePicture ??
                                                  "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ewvkffzPg2DVJEM93D25jdhjC8Kq4BSClkdT7GiLz1Dqs3YYXiMNVU4RYXGTjXSsjkX84yOspLDkfZw0_9QkI32lCjtP3IdMwBh7mp7kY4ZDf_F7MgQEQG3i8yUwPsyzoPkJ15LyL60egXLznpCpABaqmB98USnmyujPPjvaBNKCfnkVBGkYkkXpkIGYFliuTuTDdzmBiSVIv0cb5wqfK3FkSRF2ANWJ-_T6Qfjthaqv9Kktq_XqHpfvbbZ5CEyi3m-0FlRZ4SgU",
                                            ),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                    color: _primaryColor,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.camera_alt,
                                    size: 20,
                                    color: _bgDark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: _pickImage,
                          child: Text(
                            l10n.changeProfilePhoto,
                            style: TextStyle(
                              color: _primaryColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Form
                  _buildLabel(l10n.fullName, textColor),
                  _buildTextField(
                    _nameController,
                    l10n.enterFullName,
                    inputBgColor,
                    borderColor,
                    textColor,
                    Icons.person_outline,
                  ),

                  const SizedBox(height: 16),
                  _buildLabel(l10n.phoneNumber, textColor),
                  _buildTextField(
                    _phoneController,
                    l10n.enterPhoneNumber,
                    inputBgColor,
                    borderColor,
                    textColor,
                    Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                  ),

                  const SizedBox(height: 16),
                  _buildLabel(l10n.email, textColor),
                  _buildTextField(
                    _emailController,
                    l10n.enterEmailAddress,
                    inputBgColor,
                    borderColor,
                    textColor,
                    Icons.mail_outline,
                    keyboardType: TextInputType.emailAddress,
                  ),

                  const SizedBox(height: 16),
                  _buildLabel(l10n.gender, textColor),
                  _buildDropdown(
                    value: _selectedGender,
                    hint: l10n.selectGender,
                    items: [
                      DropdownMenuItem(value: 'MALE', child: Text(l10n.male)),
                      DropdownMenuItem(
                        value: 'FEMALE',
                        child: Text(l10n.female),
                      ),
                      DropdownMenuItem(value: 'OTHER', child: Text(l10n.other)),
                    ],
                    onChanged: (val) => setState(() => _selectedGender = val),
                    bgColor: inputBgColor,
                    borderColor: borderColor,
                    textColor: textColor,
                  ),

                  const SizedBox(height: 16),
                  _buildLabel(l10n.userType, textColor),
                  _buildDropdown(
                    value: _selectedUserType,
                    hint: l10n.selectUserType,
                    items:
                        userTypeMap.entries.map((e) {
                          return DropdownMenuItem(
                            value: e.key,
                            child: Text(e.value),
                          );
                        }).toList(),
                    onChanged: (val) => setState(() => _selectedUserType = val),
                    bgColor: inputBgColor,
                    borderColor: borderColor,
                    textColor: textColor,
                  ),

                  const SizedBox(height: 16),
                  _buildLabel(l10n.location, textColor),
                  // State Dropdown
                  _buildDropdown(
                    value: _selectedStateId,
                    hint: l10n.selectState,
                    items:
                        _states.map<DropdownMenuItem<String>>((s) {
                          return DropdownMenuItem<String>(
                            value: s['id'].toString(),
                            child: Text(
                              s['name'][dataLocale] ?? s['name']['en'],
                            ),
                          );
                        }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedStateId = val;
                        // Find the number for this state to fetch townships
                        final state =
                            _states.where((s) => s['id'] == val).firstOrNull;
                        if (state != null) {
                          _selectedStateNumber =
                              state['number']['en'].toString();
                          _selectedTownshipId = null; // Reset township
                          _fetchTownships(_selectedStateNumber!);
                        }
                      });
                    },
                    bgColor: inputBgColor,
                    borderColor: borderColor,
                    textColor: textColor,
                  ),
                  const SizedBox(height: 12),
                  // Township Dropdown
                  _buildDropdown(
                    value: _selectedTownshipId,
                    hint:
                        _isLoadingTownships
                            ? l10n.loadingTownships
                            : l10n.selectTownship,
                    items:
                        _townships.map<DropdownMenuItem<String>>((t) {
                          return DropdownMenuItem<String>(
                            value: t['id'].toString(),
                            child: Text(
                              t['name'][dataLocale] ?? t['name']['en'],
                            ),
                          );
                        }).toList(),
                    onChanged:
                        _selectedStateId == null
                            ? null
                            : (val) =>
                                setState(() => _selectedTownshipId = val),
                    bgColor: inputBgColor,
                    borderColor: borderColor,
                    textColor: textColor,
                  ),
                  const SizedBox(height: 12),
                  // Address Input
                  _buildTextField(
                    _addressController,
                    l10n.enterAddress,
                    inputBgColor,
                    borderColor,
                    textColor,
                    Icons.location_on_outlined,
                  ),

                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _onSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: _bgDark,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 4,
                        shadowColor: _primaryColor.withOpacity(0.4),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.save_outlined),
                          const SizedBox(width: 8),
                          Text(
                            l10n.saveChanges,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint,
    Color bgColor,
    Color borderColor,
    Color textColor,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: TextStyle(color: textColor, fontSize: 16),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.grey[400]),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
          suffixIcon: Icon(icon, color: Colors.grey[400]),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required String hint,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?>? onChanged,
    required Color bgColor,
    required Color borderColor,
    required Color textColor,
  }) {
    final isEnabled = onChanged != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isEnabled ? bgColor : bgColor.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          hint: Text(hint, style: TextStyle(color: Colors.grey[400])),
          items: items,
          onChanged: onChanged,
          dropdownColor: bgColor,
          style: TextStyle(color: textColor, fontSize: 16),
          icon: Icon(Icons.expand_more, color: Colors.grey[400]),
          isExpanded: true,
        ),
      ),
    );
  }
}
