import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../constants/user_types.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String _userType = UserTypes.farmer;
  String _countryCode = '+95';
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.passwordsDoNotMatch),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.register(
        name: _nameController.text,
        phoneNumber: '$_countryCode${_phoneController.text}',
        email: _emailController.text.isEmpty ? null : _emailController.text,
        password: _passwordController.text,
        userType: _userType,
      );
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      if (mounted) {
        CommonSnackbar.show(
          context,
          message: '${AppLocalizations.of(context)!.registrationFailed} $e',
          position: SnackBarPosition.bottom,
          type: SnackBarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors
    const primaryColor = Color(0xFF2BEE5B);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor = isDark ? const Color(0xFF1A2C20) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF111813);
    final borderColor =
        isDark ? const Color(0xFF2A4030) : const Color(0xFFDBE6DE);
    const iconColor = Color(0xFF61896B);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color:
                          isDark
                              ? Colors.white.withOpacity(0.1)
                              : Colors.black.withOpacity(0.05),
                    ),
                    child: IconButton(
                      icon: Icon(
                        Icons.arrow_back_ios_new,
                        size: 20,
                        color: textColor,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      AppLocalizations.of(context)!.createAccount,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // Balance the back button
                ],
              ),
            ),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Hero Image
                      Container(
                        height: 160,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: const DecorationImage(
                            image: NetworkImage(
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBy8idy4kKBxNd7SuF7aDLF78CTC9TKjs42eeFqbI8oYTNFyvntwsr6aeE25PnBzSXUyOnKIlmK8p2EQVYDiVxo4BSK8JzzEAjteA4pPyQeotWdldekonoMEgI8IO1nn2esqvZmguRuT6NApf0euw3vV7a8k7TJzfkBpFLXQraelwvh_lp51pa6VxMmMToM1g_80PMlubIKmhg9g93sSaOXlEjNVWz1f1tGlIZ48__xO14_L18etF_o8LSnT8fSlyxSxu5DGU24eblZ',
                            ),
                            fit: BoxFit.cover,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                gradient: LinearGradient(
                                  begin: Alignment.bottomCenter,
                                  end: Alignment.topCenter,
                                  colors: [
                                    Colors.black.withOpacity(0.6),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 16,
                              left: 16,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: primaryColor,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 8,
                                      offset: Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.spa,
                                  size: 20,
                                  color: Color(0xFF102215),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Headline
                      Text(
                        AppLocalizations.of(context)!.joinCommunity,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: textColor,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.connectWithFarmers,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: textColor.withOpacity(0.7),
                          fontSize: 14,
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Form Fields
                      _buildLabel(
                        AppLocalizations.of(context)!.fullName,
                        textColor,
                      ),
                      _buildTextField(
                        controller: _nameController,
                        hint: AppLocalizations.of(context)!.enterFullName,
                        icon: Icons.person,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textColor: textColor,
                        iconColor: iconColor,
                        primaryColor: primaryColor,
                        validator:
                            (v) =>
                                v?.isEmpty ?? true
                                    ? AppLocalizations.of(context)!.required
                                    : null,
                      ),
                      const SizedBox(height: 16),

                      _buildLabel(
                        AppLocalizations.of(context)!.phoneNumber,
                        textColor,
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            style: TextStyle(color: textColor),
                            validator:
                                (v) =>
                                    v?.isEmpty ?? true
                                        ? AppLocalizations.of(context)!.required
                                        : null,
                            decoration: InputDecoration(
                              hintText:
                                  AppLocalizations.of(
                                    context,
                                  )!.phonePlaceholder,
                              hintStyle: TextStyle(
                                color: iconColor.withOpacity(0.6),
                              ),
                              filled: true,
                              fillColor: surfaceColor,
                              prefixIcon: Container(
                                padding: const EdgeInsets.only(
                                  left: 4,
                                  right: 4,
                                ),
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  border: Border(
                                    right: BorderSide(color: borderColor),
                                  ),
                                ),
                                child: CountryCodePicker(
                                  onChanged: (country) {
                                    setState(() {
                                      _countryCode = country.dialCode!;
                                    });
                                  },
                                  initialSelection: 'MM',
                                  favorite: const ['+95', 'MM'],
                                  showCountryOnly: false,
                                  showOnlyCountryWhenClosed: false,
                                  alignLeft: false,
                                  padding: EdgeInsets.zero,
                                  flagWidth: 20,
                                  textStyle: TextStyle(
                                    color: textColor,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  dialogTextStyle: TextStyle(
                                    color: Colors.black,
                                  ),
                                  searchStyle: TextStyle(color: Colors.black),
                                ),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: borderColor),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: primaryColor.withOpacity(0.5),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      _buildLabel(
                        AppLocalizations.of(context)!.emailAddress,
                        textColor,
                      ),
                      _buildTextField(
                        controller: _emailController,
                        hint: AppLocalizations.of(context)!.emailPlaceholder,
                        icon: Icons.mail,
                        keyboardType: TextInputType.emailAddress,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textColor: textColor,
                        iconColor: iconColor,
                        primaryColor: primaryColor,
                      ),
                      const SizedBox(height: 16),

                      _buildLabel(
                        AppLocalizations.of(context)!.iAmA,
                        textColor,
                      ),
                      _buildDropdown(
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textColor: textColor,
                        iconColor: iconColor,
                        primaryColor: primaryColor,
                      ),
                      const SizedBox(height: 16),

                      _buildLabel(
                        AppLocalizations.of(context)!.password,
                        textColor,
                      ),
                      _buildTextField(
                        controller: _passwordController,
                        hint: AppLocalizations.of(context)!.passwordPlaceholder,
                        icon: Icons.lock,
                        obscureText: _obscurePassword,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textColor: textColor,
                        iconColor: iconColor,
                        primaryColor: primaryColor,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: iconColor,
                          ),
                          onPressed:
                              () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                        ),
                        validator:
                            (v) =>
                                v?.isEmpty ?? true
                                    ? AppLocalizations.of(context)!.required
                                    : null,
                      ),
                      const SizedBox(height: 16),

                      _buildLabel(
                        AppLocalizations.of(context)!.confirmPassword,
                        textColor,
                      ),
                      _buildTextField(
                        controller: _confirmPasswordController,
                        hint: AppLocalizations.of(context)!.passwordPlaceholder,
                        icon: Icons.lock_reset,
                        obscureText: true,
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textColor: textColor,
                        iconColor: iconColor,
                        primaryColor: primaryColor,
                        validator: (v) {
                          if (v?.isEmpty ?? true)
                            return AppLocalizations.of(context)!.required;
                          if (v != _passwordController.text)
                            return AppLocalizations.of(
                              context,
                            )!.passwordsDoNotMatch;
                          return null;
                        },
                      ),

                      const SizedBox(height: 32),

                      // CTA Button
                      SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleRegister,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: const Color(0xFF102215),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child:
                              _isLoading
                                  ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                  : Text(
                                    AppLocalizations.of(context)!.register,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Footer
                      Center(
                        child: GestureDetector(
                          onTap:
                              () => Navigator.pushReplacementNamed(
                                context,
                                '/login',
                              ),
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(
                                color: textColor.withOpacity(0.7),
                                fontSize: 14,
                              ),
                              children: [
                                TextSpan(
                                  text:
                                      AppLocalizations.of(
                                        context,
                                      )!.alreadyHaveAccount,
                                ),
                                TextSpan(
                                  text: AppLocalizations.of(context)!.logIn,
                                  style: const TextStyle(
                                    color: primaryColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 4),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required Color surfaceColor,
    required Color borderColor,
    required Color textColor,
    required Color iconColor,
    required Color primaryColor,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      style: TextStyle(color: textColor),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: iconColor.withOpacity(0.6)),
        prefixIcon: Icon(icon, color: iconColor, size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: primaryColor.withOpacity(0.5),
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required Color surfaceColor,
    required Color borderColor,
    required Color textColor,
    required Color iconColor,
    required Color primaryColor,
  }) {
    return DropdownButtonFormField<String>(
      value: _userType,
      items:
          userTypeLabels.entries.map((entry) {
            return DropdownMenuItem(
              value: entry.key,
              child: Text(entry.value, style: TextStyle(color: textColor)),
            );
          }).toList(),
      onChanged: (v) => setState(() => _userType = v!),
      dropdownColor: surfaceColor,
      icon: Icon(Icons.expand_more, color: iconColor),
      decoration: InputDecoration(
        prefixIcon: Icon(Icons.agriculture, color: iconColor, size: 20),
        filled: true,
        fillColor: surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: primaryColor.withOpacity(0.5),
            width: 2,
          ),
        ),
      ),
    );
  }
}
