import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

import 'package:ayar_farm/l10n/app_localizations.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _identifierController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _identifierController.dispose();
    super.dispose();
  }

  Future<void> _handleSendResetCode() async {
    if (_identifierController.text.isEmpty) {
      CommonSnackbar.show(
        context,
        message: AppLocalizations.of(context)!.enterEmailOrPhone,
        type: SnackBarType.info,
        position: SnackBarPosition.bottom,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final input = _identifierController.text;
      final isEmail = input.contains('@');

      await AuthService.requestPasswordReset(
        email: isEmail ? input : null,
        phoneNumber: !isEmail ? input : null,
      );

      if (mounted) {
        CommonSnackbar.show(
          context,
          message: AppLocalizations.of(context)!.resetCodeSent,
          type: SnackBarType.info,
          position: SnackBarPosition.bottom,
        );
        // Navigate to ResetPasswordScreen (which contains the OTP and New Password fields)
        Navigator.pushNamed(
          context,
          '/reset-password',
          arguments: {'identifier': input, 'isEmail': isEmail},
        );
      }
    } catch (e) {
      if (mounted) {
        CommonSnackbar.show(
          context,
          message: '${AppLocalizations.of(context)!.failedToSendResetCode}$e',
          type: SnackBarType.error,
          position: SnackBarPosition.bottom,
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
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor = isDark ? const Color(0xFF1C3022) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF111813);
    final textSubColor =
        isDark
            ? Colors.white.withOpacity(0.7)
            : const Color(0xFF111813).withOpacity(0.7);
    final borderColor =
        isDark ? const Color(0xFF2A4530) : const Color(0xFFDBE6DE);
    final placeholderColor = const Color(0xFF61896B);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
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
                      icon: Icon(Icons.arrow_back, size: 24, color: textColor),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 24),
                    // Illustration
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        width: double.infinity,
                        height: 240,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: const DecorationImage(
                            image: NetworkImage(
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuD4F2ntztRrKNMLvMVHkug6XAunnVN3uHyDCYPo05kTt3IeukGCRg3JwAVjMdk6SJXjtIjz6s1SzdEQEaLRfOKk3sF8OE1pDKWKgCIOUjaEUKDOe2rFHNF9pzL1bEv_VX8ciAGNJi82NeC_UtKm9gPSPPRmUrbFL1seF4HCW-Feg7uvR3itWpYGjqLCG2fgLoFOLJAiwxmAZ663XMaRs9dYQW1XQgQImH9nrV-mXUJPcbzUopAUja3WQKjAv_hY-FUIZ-UXm7EYv-Zs',
                            ),
                            fit: BoxFit.contain,
                            alignment: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ),

                    // Headlines
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            AppLocalizations.of(context)!.resetPasswordTitle,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: textColor,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              AppLocalizations.of(
                                context,
                              )!.resetPasswordSubtitle,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: textSubColor,
                                fontSize: 16,
                                height: 1.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),

                    // Form
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 4, bottom: 8),
                            child: Text(
                              AppLocalizations.of(context)!.emailOrPhoneLabel,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          TextField(
                            controller: _identifierController,
                            style: TextStyle(color: textColor),
                            decoration: InputDecoration(
                              hintText:
                                  AppLocalizations.of(
                                    context,
                                  )!.emailOrPhonePlaceholder,
                              hintStyle: TextStyle(color: placeholderColor),
                              filled: true,
                              fillColor: surfaceColor,
                              contentPadding: const EdgeInsets.all(15),
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
                                borderSide: const BorderSide(
                                  color: primaryColor,
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Action Button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                      child: SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleSendResetCode,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: const Color(0xFF102215),
                            elevation: 0,
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
                                    AppLocalizations.of(context)!.sendResetCode,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                        ),
                      ),
                    ),

                    // Footer Links
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                AppLocalizations.of(context)!.rememberPassword,
                                style: TextStyle(
                                  color: textSubColor,
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: Text(
                                  AppLocalizations.of(context)!.logIn,
                                  style: TextStyle(
                                    color: textColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () {
                              // TODO: Implement help navigation
                            },
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  AppLocalizations.of(context)!.needMoreHelp,
                                  style: const TextStyle(
                                    color: primaryColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.open_in_new,
                                  size: 18,
                                  color: primaryColor,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
