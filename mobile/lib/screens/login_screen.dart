import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  String _loginType = 'phone';
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final response = await AuthService.login(
        phoneNumber: _loginType == 'phone' ? _identifierController.text : null,
        email: _loginType == 'email' ? _identifierController.text : null,
        password: _passwordController.text,
      );
      if (response.token != null) {
        ApiService.setToken(response.token);
        AuthService.currentUser = response.user;
        await AuthService.saveSession(response.token!, response.user!);

        if (response.user != null) {
          SocketService().connect(response.token!, response.user!);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.loginSuccessful),
            ),
          );
          Navigator.pushReplacementNamed(context, '/home');
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(response.message)));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.errorOccurred)),
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

    // Colors from HTML design
    const primaryColor = Color(0xFF2BEE5B);
    const onPrimaryColor = Color(0xFF052E11);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF1A3322) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFE0E6E2) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8FAE96) : const Color(0xFF61896B);
    final borderColor =
        isDark ? const Color(0xFF2A4230) : const Color(0xFFDBE6DE);

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
                        Icons.arrow_back,
                        size: 24,
                        color: textMainColor,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
            ),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      // Logo and Title
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            'assets/logo.png',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        AppLocalizations.of(context)!.welcomeBack,
                        style: TextStyle(
                          color: textMainColor,
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.connectWithCommunity,
                        style: TextStyle(color: textSubColor, fontSize: 16),
                      ),
                      const SizedBox(height: 24),

                      // Toggle Switch
                      Container(
                        height: 48,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: surfaceColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap:
                                    () => setState(() => _loginType = 'phone'),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color:
                                        _loginType == 'phone'
                                            ? primaryColor
                                            : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    AppLocalizations.of(context)!.phoneNumber,
                                    style: TextStyle(
                                      color:
                                          _loginType == 'phone'
                                              ? onPrimaryColor
                                              : textSubColor,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap:
                                    () => setState(() => _loginType = 'email'),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color:
                                        _loginType == 'email'
                                            ? primaryColor
                                            : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    AppLocalizations.of(context)!.email,
                                    style: TextStyle(
                                      color:
                                          _loginType == 'email'
                                              ? onPrimaryColor
                                              : textSubColor,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Identifier Field
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 4, bottom: 8),
                            child: Text(
                              _loginType == 'phone'
                                  ? AppLocalizations.of(context)!.mobileNumber
                                  : AppLocalizations.of(context)!.emailAddress,
                              style: TextStyle(
                                color: textMainColor,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          TextFormField(
                            controller: _identifierController,
                            keyboardType:
                                _loginType == 'phone'
                                    ? TextInputType.phone
                                    : TextInputType.emailAddress,
                            style: TextStyle(color: textMainColor),
                            validator:
                                (v) =>
                                    v?.isEmpty ?? true
                                        ? AppLocalizations.of(context)!.required
                                        : null,
                            decoration: InputDecoration(
                              hintText:
                                  _loginType == 'phone'
                                      ? AppLocalizations.of(
                                        context,
                                      )!.phonePlaceholder
                                      : AppLocalizations.of(
                                        context,
                                      )!.emailPlaceholder,
                              hintStyle: TextStyle(
                                color: textSubColor.withOpacity(0.7),
                              ),
                              filled: true,
                              fillColor: surfaceColor,
                              prefixIcon:
                                  _loginType == 'phone'
                                      ? Container(
                                        width: 80,
                                        padding: const EdgeInsets.only(
                                          left: 12,
                                          right: 8,
                                        ),
                                        margin: const EdgeInsets.only(right: 8),
                                        decoration: BoxDecoration(
                                          border: Border(
                                            right: BorderSide(
                                              color: borderColor,
                                            ),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Text(
                                              '+95', // Defaulting to Myanmar code based on context
                                              style: TextStyle(
                                                color: textMainColor,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            Icon(
                                              Icons.expand_more,
                                              size: 16,
                                              color: textSubColor,
                                            ),
                                          ],
                                        ),
                                      )
                                      : Icon(
                                        Icons.email_outlined,
                                        color: textSubColor,
                                      ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
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
                      const SizedBox(height: 20),

                      // Password Field
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 4, bottom: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  AppLocalizations.of(context)!.password,
                                  style: TextStyle(
                                    color: textMainColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    Navigator.pushNamed(
                                      context,
                                      '/forgot-password',
                                    );
                                  },
                                  child: Text(
                                    AppLocalizations.of(context)!.forgot,
                                    style: TextStyle(
                                      color: primaryColor,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: TextStyle(color: textMainColor),
                            validator:
                                (v) =>
                                    v?.isEmpty ?? true
                                        ? AppLocalizations.of(context)!.required
                                        : null,
                            decoration: InputDecoration(
                              hintText:
                                  AppLocalizations.of(context)!.enterPassword,
                              hintStyle: TextStyle(
                                color: textSubColor.withOpacity(0.7),
                              ),
                              filled: true,
                              fillColor: surfaceColor,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  color: textSubColor,
                                ),
                                onPressed:
                                    () => setState(
                                      () =>
                                          _obscurePassword = !_obscurePassword,
                                    ),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
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
                      const SizedBox(height: 32),

                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: onPrimaryColor,
                            elevation: 4,
                            shadowColor: primaryColor.withOpacity(0.2),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child:
                              _isLoading
                                  ? SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        onPrimaryColor,
                                      ),
                                    ),
                                  )
                                  : Text(
                                    AppLocalizations.of(context)!.logIn,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Footer
                      GestureDetector(
                        onTap:
                            () => Navigator.pushReplacementNamed(
                              context,
                              '/register',
                            ),
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(
                              color: textSubColor,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            children: [
                              TextSpan(
                                text: AppLocalizations.of(context)!.newHere,
                              ),
                              TextSpan(
                                text:
                                    AppLocalizations.of(context)!.createAccount,
                                style: TextStyle(
                                  color: textMainColor,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                  decorationColor: primaryColor,
                                  decorationThickness: 2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
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
}
