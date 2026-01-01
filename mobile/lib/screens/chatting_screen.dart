import 'package:ayar_farm/widgets/common_header.dart';
import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';

class ChattingScreen extends StatefulWidget {
  const ChattingScreen({super.key});

  @override
  State<ChattingScreen> createState() => _ChattingScreenState();
}

class _ChattingScreenState extends State<ChattingScreen> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors from HTML design
    const primaryColor = Color(0xFF2BEE5B);
    const primaryContentColor = Color(0xFF052E11);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFFFFFFF);
    final surfaceHighlightColor =
        isDark ? const Color(0xFF1E3626) : const Color(0xFFF0F4F1);
    final textMainColor =
        isDark ? const Color(0xFFE1E6E2) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final borderColor =
        isDark ? const Color(0xFF1E3626) : const Color(0xFFF9FAFB);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          const CommonHeader(),
          // Search Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: surfaceColor,
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: surfaceHighlightColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 16, right: 8),
                    child: Icon(Icons.search, color: textSubColor),
                  ),
                  Expanded(
                    child: TextField(
                      style: TextStyle(color: textMainColor),
                      decoration: InputDecoration(
                        hintText:
                            AppLocalizations.of(
                              context,
                            )!.searchFarmersPlaceholder,
                        hintStyle: TextStyle(color: textSubColor),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.only(bottom: 4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Segmented Controls
          Container(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            color: surfaceColor,
            child: Container(
              height: 40,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: surfaceHighlightColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  _buildSegmentButton(
                    'All',
                    AppLocalizations.of(context)!.catAll,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                  _buildSegmentButton(
                    'Groups',
                    AppLocalizations.of(context)!.groups,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                  _buildSegmentButton(
                    'Mentors',
                    AppLocalizations.of(context)!.mentors,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                ],
              ),
            ),
          ),

          // Chat List
          Expanded(
            child: Container(
              color: surfaceColor,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  _buildChatItem(
                    title: 'Rice Farmers Assoc.',
                    message: 'David: Has anyone tried the new fertilizer?',
                    time: '10m',
                    imageUrl:
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuC2Af-2u-zFaoBJOHiBMSWk3PPyqoJjuic-ejf_m-IRTtb2MaBRuiUBNjljkLeV2Tlt3xFjalMq6PuYG8hidu4ira4VcBDUC0dzJc4WqLWSIrAXnr53d7SKXha5hBkp7yDX7vFMPzRP2JQi5S1Dy6RsF74wlKpFVSYmDN5NGglmcOSVTRl59_dd4_6j9dAnIaTGcBDZxSzTk0nDqQ074mZBU3n0555NTPJRD2n2D5kxlPjAOwK_4GPYM9FDMmn4kanGfsL0XKAP1r_L',
                    unreadCount: 3,
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                  _buildChatItem(
                    title: 'Pest Control Q&A',
                    message: 'You: Thanks for the tip!',
                    time: '1h',
                    imageUrl:
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuAy-qoL7S2eBkkq93OmBR_aEdzODuIcE75-9_QIh7N4YCIy02T27dcld1_iWLoqgZIOg5ijY2r2nK4sqTyCyH8YHWzvJyhIZK2_GNn0cbZAmHNTpT5neLA8wNc7jv89qJKMPzM2L6vudJwahYKDo8sHGPcuHs4cs0L8f5IhVWzOzYVzEN8PTCehkVbC060jIXvy38uyOsUDd5v0NZWgy8NpUXocHScKO6JkeQOqrOt3l7qpeHPjtevtoVCDVGfbBp1rRE6R8ObpyQhY',
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                  _buildChatItem(
                    title: 'Maria (Agronomist)',
                    message: AppLocalizations.of(context)!.sentAnImage,
                    time: 'Yesterday',
                    imageUrl:
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBe5Y7Iib7c6c7SC4NNJIzkfNDlrt8-vBHEW4-I1qD3QjdFGoLV8QrGrMmK8SOYoMnyc5zBSrE4FJoixNWvAqcfQhiElhtYdDVsmqG2aDX95m3pqrgXlBM2iFEfaQOZZhl8pcFfoLzIsC3iY20STtodXXd84yROigGFxNi-FdrQ8DLp8CtN7raVQWg7ZwD0a0229lSrpmma54mxuhiX6eSMwPWI7_mznB6QfmRO_KVXoMq-AY8rfN23Nwk4C5XLowPf1M_bq6iWRtAO',
                    isOnline: true,
                    isImage: true,
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                  _buildChatItem(
                    title: 'John Doe',
                    message: 'Can I borrow the tractor next week?',
                    time: '2d',
                    initials: 'JD',
                    initialsColor: Colors.blue,
                    initialsBgColor:
                        isDark
                            ? Colors.blue.withOpacity(0.4)
                            : Colors.blue.shade100,
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                  _buildChatItem(
                    title: 'Machinery Repair',
                    message: "Alex: It's usually the fuel filter.",
                    time: '3d',
                    imageUrl:
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCcPB7knPacGrYgyocklW9KLCYL7i_xWlCG6l-J3SToagM_Bvv1HQJF8k-zxD90sOfZ6f-hfbh8R5bCcQLaz0Be-viQYBCLn08500VUNT_YdGYDv6Cn5DJWnH56WJHQ3eIv7iggZQZMvPgR5v-jxzEB2AjM3fpzd1GzL-8vEUV0rCXJPrbfq9AOM3VWicRyGp1xbLsBeSahjlIDdFmNf5W8YEq2TuD6ptlyy9Bes6sVvYIqky9jY8VRphJPILsPqe8c-k537IxegdCp',
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                  _buildChatItem(
                    title: 'Corn Growers',
                    message: 'Harvest is starting early this year!',
                    time: '1w',
                    imageUrl:
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCLQ-eOQ1SsiXp8ASHV5itcvPn1jfHIWcPUELSfgLSkzygDp14FdRcyaDvRmmvfxlbCR3espN964GQxBbq_-eO555fA2zEJwhDjzzvf0hCMeFtGGMSLF-t4DTAiHUaBz9cANit9-E_G0S0CB24k4UpK1vpsnGf_eAJncjSMWVs-I_UK_JHt6LL7PKDYklqUSrCkVqikS3IzJrLc7qK9i1xUIGA0oydugjflmO3HifDub6WLSO_qmmOu3LgdEfX8gIgaZRZTvp12k3Uh',
                    textMainColor: textMainColor,
                    textSubColor: textSubColor,
                    borderColor: borderColor,
                    primaryColor: primaryColor,
                    primaryContentColor: primaryContentColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: Container(
        width: 56,
        height: 56,
        margin: const EdgeInsets.only(bottom: 60), // Above bottom nav
        decoration: BoxDecoration(
          color: primaryColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: primaryColor.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: IconButton(
          icon: const Icon(Icons.add, color: primaryContentColor, size: 32),
          onPressed: () {},
        ),
      ),
    );
  }

  Widget _buildSegmentButton(
    String value,
    String label,
    bool isDark,
    Color activeBg,
    Color activeText,
    Color inactiveText,
  ) {
    final isSelected = _selectedFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedFilter = value;
          });
        },
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? activeBg : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
            boxShadow:
                isSelected
                    ? [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 2,
                        offset: const Offset(0, 1),
                      ),
                    ]
                    : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? activeText : inactiveText,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChatItem({
    required String title,
    required String message,
    required String time,
    String? imageUrl,
    String? initials,
    Color? initialsColor,
    Color? initialsBgColor,
    int unreadCount = 0,
    bool isOnline = false,
    bool isImage = false,
    required Color textMainColor,
    required Color textSubColor,
    required Color borderColor,
    required Color primaryColor,
    required Color primaryContentColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              if (imageUrl != null)
                CircleAvatar(
                  radius: 28,
                  backgroundImage: NetworkImage(imageUrl),
                )
              else
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: initialsBgColor,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initials ?? '',
                    style: TextStyle(
                      color: initialsColor,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              if (isOnline)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          color: textMainColor,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      time,
                      style: TextStyle(
                        color: unreadCount > 0 ? primaryColor : textSubColor,
                        fontSize: 12,
                        fontWeight:
                            unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          if (isImage) ...[
                            Icon(Icons.image, size: 16, color: textSubColor),
                            const SizedBox(width: 4),
                          ],
                          Expanded(
                            child: Text(
                              message,
                              style: TextStyle(
                                color:
                                    unreadCount > 0
                                        ? textMainColor
                                        : textSubColor,
                                fontSize: 14,
                                fontWeight:
                                    unreadCount > 0
                                        ? FontWeight.w500
                                        : FontWeight.normal,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (unreadCount > 0)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: primaryColor,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        constraints: const BoxConstraints(minWidth: 16),
                        alignment: Alignment.center,
                        child: Text(
                          unreadCount.toString(),
                          style: TextStyle(
                            color: primaryContentColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
