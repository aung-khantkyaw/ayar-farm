import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:ayar_farm/l10n/app_localizations.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors from the design
    const primaryColor = Color(0xFF2BEE5B);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textColor = isDark ? Colors.white : const Color(0xFF111813);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Hero Section with Image and Floating Logo
          SizedBox(
            height: size.height * 0.55 + 40, // Image height + half logo height
            child: Stack(
              alignment: Alignment.topCenter,
              clipBehavior: Clip.none,
              children: [
                // Image with rounded bottom
                Container(
                  height: size.height * 0.55,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(40),
                    ),
                    image: DecorationImage(
                      image: NetworkImage(
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDO6qIELRy3sw78iW5seCwfPUID7URfllDLqponXq3USYNZwXhdzLJqnvy8ZEuEQe87kwqqWMl-uNBQov7NV47h3s2yGNAWCaJe_Ix6yr0Cb0RSyMqU7pmvbT8Ucc7DUaG4vOgDwNi44CAY30QYM9d4P3kGaq08l9AGfdx2OzEl2oQ6a4In0LIbHoYGFgWy8NQ5zoD-2h8qmK4Bs6qqFaLcPncmS6ttM7HXjhI_jZklL0ajUMKBLkXECWSjiPVCtv1AVMYFt3rWez_h',
                      ),
                      fit: BoxFit.cover,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 20,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(40),
                      ),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.1),
                          Colors.transparent,
                          Colors.black.withOpacity(0.2),
                        ],
                      ),
                    ),
                  ),
                ),
                // Floating Logo
                Positioned(
                  bottom: 0,
                  child: Transform.rotate(
                    angle: 3 * 3.14159 / 180, // 3 degrees
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: primaryColor,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          'assets/logo.png',
                          width: 40,
                          height: 40,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Text Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const SizedBox(height: 24),
                  Text(
                    AppLocalizations.of(context)!.appTitle,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    AppLocalizations.of(context)!.welcomeSubtitle,
                    style: TextStyle(
                      color: textColor.withOpacity(0.7),
                      fontSize: 18,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const Spacer(),

                  // Buttons
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: const Color(0xFF111813),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        shadowColor: primaryColor.withOpacity(0.25),
                      ).copyWith(elevation: WidgetStateProperty.all(8)),
                      child: Text(
                        AppLocalizations.of(context)!.createNewAccount,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/login');
                      },
                      style: TextButton.styleFrom(
                        backgroundColor:
                            isDark
                                ? surfaceColor.withOpacity(0.5)
                                : surfaceColor,
                        foregroundColor: textColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side:
                              isDark
                                  ? BorderSide(
                                    color: Colors.white.withOpacity(0.1),
                                  )
                                  : BorderSide.none,
                        ),
                      ),
                      child: Text(
                        AppLocalizations.of(context)!.login,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),

                  // Footer
                  Padding(
                    padding: const EdgeInsets.only(top: 24, bottom: 40),
                    child: RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: TextStyle(
                          color: textColor.withOpacity(0.4),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          fontFamily: theme.textTheme.bodyMedium?.fontFamily,
                        ),
                        children: [
                          TextSpan(
                            text:
                                AppLocalizations.of(
                                  context,
                                )!.termsAgreementPrefix,
                          ),
                          TextSpan(
                            text: AppLocalizations.of(context)!.termsOfService,
                            style: TextStyle(
                              decoration: TextDecoration.underline,
                              decorationColor: primaryColor.withOpacity(0.5),
                            ),
                          ),
                          TextSpan(text: AppLocalizations.of(context)!.and),
                          TextSpan(
                            text: AppLocalizations.of(context)!.privacyPolicy,
                            style: TextStyle(
                              decoration: TextDecoration.underline,
                              decorationColor: primaryColor.withOpacity(0.5),
                            ),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
