import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'machine_screen.dart';

class MachineTypeScreen extends StatefulWidget {
  const MachineTypeScreen({super.key});

  @override
  State<MachineTypeScreen> createState() => _MachineTypeScreenState();
}

class _MachineTypeScreenState extends State<MachineTypeScreen> {
  List<Map<String, dynamic>> _machineTypes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMachineTypes();
  }

  Future<void> _fetchMachineTypes() async {
    try {
      final response = await ApiService.get(ApiConstants.machinetypes);
      if (response['data'] != null) {
        setState(() {
          _machineTypes = List<Map<String, dynamic>>.from(response['data']);
          _isLoading = false;
        });
      } else {
        // Handle error
        setState(() {
          _isLoading = false;
        });
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${AppLocalizations.of(context)!.failedToLoadMachineTypes}${response['message'] ?? AppLocalizations.of(context)!.unknown}',
            ),
          ),
        );
      }
    } catch (e) {
      // Handle error
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${AppLocalizations.of(context)!.errorLoadingMachineTypes}$e',
          ),
        ),
      );
    }
  }

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
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: surfaceColor.withOpacity(0.95),
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
                      color: isDark ? Colors.grey[800] : Colors.grey[100],
                    ),
                    child: Icon(Icons.arrow_back, color: textMainColor),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    AppLocalizations.of(context)!.machineTypes,
                    style: TextStyle(
                      color: textMainColor,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child:
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _machineTypes.isEmpty
                    ? const Center(child: Text('No machine types available'))
                    : RefreshIndicator(
                      onRefresh: _fetchMachineTypes,
                      color: primaryColor,
                      backgroundColor: surfaceColor,
                      child: GridView.count(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        crossAxisCount: 2,
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 0.8,
                        children:
                            _machineTypes.map((machineType) {
                              return _buildMachineTypeCard(
                                machineType['name'] ?? 'Unknown',
                                machineType['description'] ?? 'No description',
                                machineType['image_urls'] != null &&
                                        machineType['image_urls'].isNotEmpty
                                    ? machineType['image_urls'][0]
                                    : '',
                                surfaceColor,
                                textMainColor,
                                textSubColor,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder:
                                          (context) => const MachineScreen(),
                                    ),
                                  );
                                },
                              );
                            }).toList(),
                      ),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildMachineTypeCard(
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
}
