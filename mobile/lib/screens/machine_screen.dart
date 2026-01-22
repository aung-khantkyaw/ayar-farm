import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'document_screen.dart';

class MachineScreen extends StatefulWidget {
  final String? machineType;

  const MachineScreen({super.key, this.machineType});

  @override
  State<MachineScreen> createState() => _MachineScreenState();
}

class _MachineScreenState extends State<MachineScreen> {
  List<Map<String, dynamic>> _machines = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMachines();
  }

  Future<void> _fetchMachines() async {
    try {
      final response = await ApiService.get(ApiConstants.machines);
      if (response['data'] != null) {
        List<Map<String, dynamic>> allCrops = List<Map<String, dynamic>>.from(
          response['data'],
        );
        setState(() {
          if (widget.machineType != null) {
            _machines =
                allCrops
                    .where(
                      (machine) =>
                          machine['MachineTypes']['name'] == widget.machineType,
                    )
                    .toList();
          } else {
            _machines = allCrops;
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        CommonSnackbar.show(
          context,
          message:
              '${AppLocalizations.of(context)!.failedToLoadMachines}${response['message'] ?? AppLocalizations.of(context)!.unknown}',
          type: SnackBarType.info,
          position: SnackBarPosition.bottom,
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      CommonSnackbar.show(
        context,
        position: SnackBarPosition.bottom,
        type: SnackBarType.error,
        message: '${AppLocalizations.of(context)!.errorLoadingMachines}$e',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors
    const primaryColor = Color(0xFF2BEE5B);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFFFFFFF) : const Color(0xFF111813);
    final textMutedColor =
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
                    AppLocalizations.of(context)!.machines,
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

          // Grid
          Expanded(
            child:
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _machines.isEmpty
                    ? const Center(child: Text('No machines available'))
                    : RefreshIndicator(
                      onRefresh: _fetchMachines,
                      color: primaryColor,
                      backgroundColor: surfaceColor,
                      child: GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.75,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                            ),
                        itemCount: _machines.length,
                        itemBuilder: (context, index) {
                          final machine = _machines[index];
                          return _buildMachineCard(
                            machine,
                            surfaceColor,
                            textMainColor,
                            textMutedColor,
                          );
                        },
                      ),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildMachineCard(
    Map<String, dynamic> machine,
    Color surfaceColor,
    Color textMainColor,
    Color textMutedColor,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) =>
                    DocumentScreen(type: 'machine', type_id: machine['id']),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  image: DecorationImage(
                    image: NetworkImage(
                      machine['image_urls'] != null &&
                              machine['image_urls'].isNotEmpty
                          ? machine['image_urls'][machine['image_urls'].length -
                              1]
                          : '',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    machine['name'] ?? 'Unknown',
                    style: TextStyle(
                      color: textMainColor,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${machine['documents']?.length ?? 0} ${(machine['documents']?.length ?? 0) > 1 ? 'documents' : 'document'}',
                    style: TextStyle(color: textMutedColor, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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
