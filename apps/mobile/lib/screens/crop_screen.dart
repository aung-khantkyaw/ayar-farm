import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'document_screen.dart';

class CropScreen extends StatefulWidget {
  final String? cropType;

  const CropScreen({super.key, this.cropType});

  @override
  State<CropScreen> createState() => _CropScreenState();
}

class _CropScreenState extends State<CropScreen> {
  List<Map<String, dynamic>> _crops = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCrops();
  }

  Future<void> _fetchCrops() async {
    try {
      final response = await ApiService.get(ApiConstants.crops);
      if (response['data'] != null) {
        List<Map<String, dynamic>> allCrops = List<Map<String, dynamic>>.from(
          response['data'],
        );
        setState(() {
          if (widget.cropType != null) {
            _crops =
                allCrops
                    .where(
                      (crop) => crop['CropTypes']['name'] == widget.cropType,
                    )
                    .toList();
          } else {
            _crops = allCrops;
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
              '${AppLocalizations.of(context)!.failedToLoadCrops}${response['message'] ?? AppLocalizations.of(context)!.unknown}',
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
        message: '${AppLocalizations.of(context)!.errorLoadingCrops}$e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
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
                    widget.cropType ?? 'Crops & Pulses',
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
                    : _crops.isEmpty
                    ? Center(
                      child: Text(
                        widget.cropType != null
                            ? 'No crops found for ${widget.cropType}'
                            : 'No crops available',
                      ),
                    )
                    : RefreshIndicator(
                      onRefresh: _fetchCrops,
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
                        itemCount: _crops.length,
                        itemBuilder: (context, index) {
                          final crop = _crops[index];
                          return _buildCropCard(
                            crop,
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

  Widget _buildCropCard(
    Map<String, dynamic> crop,
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
                (context) => DocumentScreen(type: 'crop', type_id: crop['id']),
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
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(12),
                      ),
                      image: DecorationImage(
                        image: NetworkImage(
                          crop['image_urls'] != null &&
                                  crop['image_urls'].isNotEmpty
                              ? crop['image_urls'][crop['image_urls'].length -
                                  1]
                              : '',
                        ),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        crop['CropTypes']['name'] ?? 'Unknown',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    crop['name'] ?? 'Unknown',
                    style: TextStyle(
                      color: textMainColor,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${crop['documents']?.length ?? 0} ${(crop['documents']?.length ?? 0) > 1 ? 'documents' : 'document'}',
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
