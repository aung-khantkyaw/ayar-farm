import 'package:ayar_farm/widgets/common_header.dart';
import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../main.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'edit_profile_screen.dart';
import 'profile_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF111813);
    final subTextColor = isDark ? Colors.grey[400] : Colors.grey[500];
    final sectionHeaderColor = isDark ? Colors.grey[400] : Colors.grey[500];
    final cardColor = isDark ? const Color(0xFF1A2E20) : Colors.white;
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final borderColor = isDark ? Colors.grey[800]! : Colors.grey[100]!;
    final iconBgColor = const Color(0xFF2BEE5B).withOpacity(0.2);
    final iconColor =
        isDark ? const Color(0xFFA5D6A7) : const Color(0xFF2E7D32);

    final currentLocale = Localizations.localeOf(context);
    final languageName =
        currentLocale.languageCode == 'my' ? 'မြန်မာ' : 'English';

    final user = AuthService.currentUser;
    final userName = user?.name ?? "";
    final userContact = user?.email ?? user?.phoneNumber ?? "";
    final userImage =
        user?.profilePicture ??
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ewvkffzPg2DVJEM93D25jdhjC8Kq4BSClkdT7GiLz1Dqs3YYXiMNVU4RYXGTjXSsjkX84yOspLDkfZw0_9QkI32lCjtP3IdMwBh7mp7kY4ZDf_F7MgQEQG3i8yUwPsyzoPkJ15LyL60egXLznpCpABaqmB98USnmyujPPjvaBNKCfnkVBGkYkkXpkIGYFliuTuTDdzmBiSVIv0cb5wqfK3FkSRF2ANWJ-_T6Qfjthaqv9Kktq_XqHpfvbbZ5CEyi3m-0FlRZ4SgU";

    return Scaffold(
      backgroundColor: backgroundColor,
      body: ListView(
        padding: const EdgeInsets.only(bottom: 80), // Space for bottom nav
        children: [
          const CommonHeader(),
          // Profile Snippet
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: GestureDetector(
              onTap: () {
                if (AuthService.currentUser?.id != null) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder:
                          (context) => ProfileScreen(
                            userId: AuthService.currentUser!.id,
                          ),
                    ),
                  );
                }
                print('navigate to profile screen');
              },
              child: Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 2,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        image: DecorationImage(
                          image: NetworkImage(userImage),
                          fit: BoxFit.cover,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: TextStyle(
                              color: textColor,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            userContact,
                            style: TextStyle(color: subTextColor, fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Account Section
          _buildSectionHeader(l10n.accountSection, sectionHeaderColor),
          _buildSectionContainer(cardColor, borderColor, [
            _buildListTile(
              icon: Icons.person_outline,
              title: l10n.personalInformation,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const EditProfileScreen(),
                  ),
                );
              },
            ),
            _buildDivider(borderColor),
            _buildListTile(
              icon: Icons.lock_outline,
              title: l10n.changePassword,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              onTap: () {},
            ),
          ]),

          // Preferences Section
          _buildSectionHeader(l10n.preferencesSection, sectionHeaderColor),
          _buildSectionContainer(cardColor, borderColor, [
            // _buildListTile(
            //   icon: Icons.notifications_outlined,
            //   title: l10n.pushNotifications,
            //   textColor: textColor,
            //   iconBgColor: iconBgColor,
            //   iconColor: iconColor,
            //   trailing: Switch(
            //     value: _pushNotifications,
            //     onChanged: (value) {
            //       setState(() {
            //         _pushNotifications = value;
            //       });
            //     },
            //     activeColor: const Color(0xFF2BEE5B),
            //   ),
            // ),
            // _buildDivider(borderColor),
            _buildListTile(
              icon: Icons.translate,
              title: l10n.language,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    languageName,
                    style: TextStyle(color: subTextColor, fontSize: 14),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right, color: Colors.grey[400]),
                ],
              ),
              onTap: () {
                final newLocale =
                    currentLocale.languageCode == 'en'
                        ? const Locale('my')
                        : const Locale('en');
                appLocaleNotifier.value = newLocale;
              },
            ),
          ]),

          // Support & Privacy Section
          _buildSectionHeader(l10n.supportPrivacySection, sectionHeaderColor),
          _buildSectionContainer(cardColor, borderColor, [
            _buildListTile(
              icon: Icons.shield_outlined,
              title: l10n.privacyPolicy,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              onTap: () {},
            ),
            _buildDivider(borderColor),
            _buildListTile(
              icon: Icons.help_outline,
              title: l10n.helpCenter,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              onTap: () {},
            ),
            _buildDivider(borderColor),
            _buildListTile(
              icon: Icons.bug_report_outlined,
              title: l10n.reportBug,
              textColor: textColor,
              iconBgColor: iconBgColor,
              iconColor: iconColor,
              onTap: () {},
            ),
          ]),

          // Log Out Button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
            child: ElevatedButton(
              onPressed: () {
                ApiService.setToken(null);
                AuthService.currentUser = null;
                SocketService().disconnect();
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: cardColor,
                foregroundColor: Colors.red,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color:
                        isDark
                            ? Colors.red.withOpacity(0.3)
                            : Colors.red.withOpacity(0.1),
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.logout, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    l10n.logOut,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Version
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Text(
              'App Version 1.0.0',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color? color) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSectionContainer(
    Color color,
    Color borderColor,
    List<Widget> children,
  ) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required Color textColor,
    required Color iconBgColor,
    required Color iconColor,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 20, color: iconColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(color: textColor, fontSize: 16),
                ),
              ),
              if (trailing != null)
                trailing
              else
                Icon(Icons.chevron_right, color: Colors.grey[400], size: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider(Color color) {
    return Divider(
      height: 1,
      thickness: 1,
      color: color,
      indent: 16,
      endIndent: 16,
    );
  }
}
