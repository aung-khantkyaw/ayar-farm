import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import '../widgets/common_header.dart';
import 'market_screen.dart';
import 'weather_screen.dart';
import 'calculator_screen.dart';
import 'crop_type_screen.dart';
import 'livestock_screen.dart';
import 'fish_screen.dart';
import 'machine_type_screen.dart';
import 'document_screen.dart';

class CategoryScreen extends StatelessWidget {
  const CategoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors from HTML design
    const primaryColor = Color(0xFF2BEE5B);
    const primaryContentColor = Color(0xFF052E11);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFFFFFFF) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);

    return Column(
      children: [
        const CommonHeader(),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section 1: Knowledge Base
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.knowledgeBase,
                      style: TextStyle(
                        color: textMainColor,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.8,
                  children: [
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.crops,
                      AppLocalizations.of(context)!.farmingGuides,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDR_WWrQ9f0s0cJHSHHRlYARq_M2JBR8RZzV3vmD8GGx4Wn83-weFP9Q4a8-oSP5JUKtq2CSDDZq0kiouIFyQU6hvzoLzsymxM3iLUMr0qnVrg1Oj659dwi-52SJraEGAbaEFo-Y4gIHSLEscOQ239tKywE1km3MDH_3nzBGPiaN3Kwa83Wo84zMqVEar_K8HxiiOrl_7I54wL20ql2dihYB__8V8JJxITd5JddDjAK-ucHHzoT0wWeSxEUkr2yfM-8ZMl9Ec3yzqyo',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const CropTypeScreen(),
                            ),
                          ),
                    ),
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.livestocks,
                      AppLocalizations.of(context)!.animalHusbandry,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCb3WPmdk5HMEGEkYDQMMuX1zhC6AJU8cXbPDyrtqRD1vhQdAydQaHtUp8C6s7p_wLgEHj9yQ_YbwPuNnOPBYCP1MwzrTESf4qPWAN_n38CA4RJHgNmAp1Vooma40b9B6dX32W5TqQoEPUKE0D2z5qN4VLAjlPZT8X5b9B2R3olofAqJHs_rsrZZUI2Fd3LDPVxd3-KDm87a9hXBZJzUQiNjRd48uUThiXq6VhXT-l_i7AnnjpiVM28t3TmsPiZzGrIQUcPnlJ1kjsZ',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const LivestockScreen(),
                            ),
                          ),
                    ),
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.fishery,
                      AppLocalizations.of(context)!.aquacultureTips,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOM3vaCH19CeYdlgAEYBRW8f37OXhUqsVmuVSjsen8x2wI3fPGXMFH2Yps3BcFwFc9p-lwc_6Y19RulEjb4yxi7-9GldBvUQgti7oXK36tiAG4aRKUX5pqvsJwefxtJdwIT5jrSvV7cbFtLZuMsJyz3OHA7ZxT0DGMl7v3_3VTxIO-ni1wG701Oq5uamMJEnkOwJ9XGTAWskpcrPKlNwcmgLdb4ySiOuN9hdLj_RW-MIX2aANbwHDtd7qJYuJUg8MxmFWQXXkWo0Ga',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const FishScreen(),
                            ),
                          ),
                    ),
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.agriIndustry,
                      AppLocalizations.of(context)!.industrialTech,
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPKmuPtRD9KWqoyJ_UI0EYN6xv5VqwmwwipVqN9nor_8T32J631B4j74AKY2jcSDw9XX0hmiW_fywsl9shMcu9qJpl64QX-xwyNHrgriARPMKI-J5cvYI244xoiVgsCjnq6xQ7WVT-NPIwVJzPnY-jcohi7yV3-n-e10BQO8_ab2vjn-p07UGPmMWNj5dfJ4dJ751Ll0ykiuCi2vuNXDhjJLpDIgnCaKvJmqKTZ-R8foIhcxOFe5Sxj220sJ6byr_CTB1Jx0h9ztNH',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const MachineTypeScreen(),
                            ),
                          ),
                    ),
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.loans,
                      AppLocalizations.of(context)!.loanServices,
                      'https://res.cloudinary.com/dqr9p7iem/image/upload/v1769448501/images_2_ouiigh.jpg',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder:
                                  (context) =>
                                      const DocumentScreen(type: 'loan'),
                            ),
                          ),
                    ),
                    _buildKnowledgeCard(
                      AppLocalizations.of(context)!.agrometBulletin,
                      AppLocalizations.of(context)!.agrometInfo,
                      'https://res.cloudinary.com/dqr9p7iem/image/upload/v1769448334/images_1_naznjq.jpg',
                      surfaceColor,
                      textMainColor,
                      textSubColor,
                      onTap:
                          () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder:
                                  (context) => const DocumentScreen(
                                    type: 'agromet_bulletin',
                                  ),
                            ),
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Section 2: Tools & Utilities
                Text(
                  AppLocalizations.of(context)!.toolsUtilities,
                  style: TextStyle(
                    color: textMainColor,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                _buildToolCard(
                  AppLocalizations.of(context)!.agriCalculator,
                  AppLocalizations.of(context)!.calculatorDesc,
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMBgBNwGIqanLq_luP43546OYoPp-dhqOOfQ2oXLUxENTj7oggVnZsrCfBrrzBREvKTyy0JSNKwX8U1Y32CJmAx9qNRNMguu3wqi_72dA31UxBUVOWLMxh9wD_sD8tVI7cMTvpLTMu0Ymyywqjq123SOjRbFShBcLRvH7dELARJteSwYNexvDNDrWjs_ts7DXgVwqv_WQG7jZzo9Osb2QwXwayiopxg4zE1kDu48bRkLXTLpR3rxZ4Q4k8WFkEduNXHBxP3YSYhoxK',
                  surfaceColor,
                  textMainColor,
                  textSubColor,
                  primaryColor,
                  primaryContentColor,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CalculatorScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Section 3: Daily Insights
                Text(
                  AppLocalizations.of(context)!.dailyInsights,
                  style: TextStyle(
                    color: textMainColor,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildInsightCard(
                        AppLocalizations.of(context)!.weather,
                        '28°C',
                        'Sunny, Chance of rain 10%',
                        Icons.wb_sunny,
                        Icons.wb_cloudy,
                        isDark
                            ? const Color(0xFF1A2C38)
                            : const Color(0xFFE3F2FD),
                        isDark ? Colors.blue[100]! : Colors.blue[900]!,
                        isDark ? Colors.blue[300]! : Colors.blue[800]!,
                        Colors.blue,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const WeatherScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildInsightCard(
                        AppLocalizations.of(context)!.marketPrice,
                        'High',
                        'Wheat up by 2.4% today',
                        Icons.payments_outlined,
                        Icons.trending_up,
                        isDark
                            ? const Color(0xFF332B1A)
                            : const Color(0xFFFFF8E1),
                        isDark ? Colors.yellow[100]! : Colors.yellow[900]!,
                        isDark ? Colors.yellow[300]! : Colors.yellow[800]!,
                        Colors.orange,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const MarketScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKnowledgeCard(
    String title,
    String subtitle,
    String imageUrl,
    Color surface,
    Color textMain,
    Color textSub, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(
                    image: NetworkImage(imageUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: textMain,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Text(subtitle, style: TextStyle(color: textSub, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildToolCard(
    String title,
    String description,
    String imageUrl,
    Color surface,
    Color textMain,
    Color textSub,
    Color primary,
    Color primaryContent, {
    VoidCallback? onPressed,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.calculate_outlined, color: primary),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: TextStyle(
                        color: textMain,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(color: textSub, fontSize: 14),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: onPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primary,
                    foregroundColor: primaryContent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Text('Open Tool'),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 1,
            child: AspectRatio(
              aspectRatio: 1,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(
                    image: NetworkImage(imageUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(
    String title,
    String value,
    String subtitle,
    IconData icon,
    IconData bgIcon,
    Color bgColor,
    Color titleColor,
    Color subtitleColor,
    Color iconColor, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -10,
              right: -10,
              child: Icon(bgIcon, size: 100, color: iconColor.withOpacity(0.1)),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(icon, color: iconColor, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        title,
                        style: TextStyle(
                          color: titleColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        value,
                        style: TextStyle(
                          color: titleColor, // Using title color for value too
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(color: subtitleColor, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
