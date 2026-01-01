import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';

class MarketScreen extends StatefulWidget {
  const MarketScreen({super.key});

  @override
  State<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends State<MarketScreen> {
  List<dynamic> _marketData = [];
  bool _isLoading = true;
  String _error = '';

  // Filter Data
  List<Map<String, dynamic>> _states = [];
  List<Map<String, dynamic>> _productions = [];
  List<dynamic> _markets = [];

  // Selected Filters
  int? _selectedStateId;
  int? _selectedProductionId;
  String? _selectedMarketName;
  DateTime? _selectedDate;

  // Colors
  static const primaryColor = Color(0xFF2BEE5B);
  static const backgroundLight = Color(0xFFF6F8F6);
  static const backgroundDark = Color(0xFF102215);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceDark = Color(0xFF1A2C1E);
  static const textMainLight = Color(0xFF111813);
  static const textMainDark = Color(0xFFFFFFFF);
  static const textMutedLight = Color(0xFF61896B);
  static const textMutedDark = Color(0xFF8BA892);

  @override
  void initState() {
    super.initState();
    _fetchMetaData();
    _fetchMarkets();
    _fetchMarketData();
  }

  Future<void> _fetchMetaData() async {
    try {
      final statesResponse = await http.get(
        Uri.parse('https://myanmarmarketapi.laziestant.tech/api/states'),
      );
      final productionsResponse = await http.get(
        Uri.parse('https://myanmarmarketapi.laziestant.tech/api/productions'),
      );

      if (statesResponse.statusCode == 200 &&
          productionsResponse.statusCode == 200) {
        setState(() {
          final statesData = json.decode(statesResponse.body);
          if (statesData is Map) {
            _states =
                statesData.entries.map((e) {
                  return {
                    'id': int.tryParse(e.key) ?? 0,
                    'name': e.value.toString(),
                  };
                }).toList();
            _states.sort((a, b) => (a['id'] as int).compareTo(b['id'] as int));
          }

          final prodData = json.decode(productionsResponse.body);
          if (prodData is Map) {
            _productions =
                prodData.entries.map((e) {
                  return {
                    'id': int.tryParse(e.key) ?? 0,
                    'name': e.value.toString(),
                  };
                }).toList();
            _productions.sort(
              (a, b) => (a['id'] as int).compareTo(b['id'] as int),
            );
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching metadata: $e');
    }
  }

  Future<List<dynamic>> _getMarkets({int? stateId, int? productionId}) async {
    try {
      Map<String, String> queryParams = {};
      if (stateId != null) {
        queryParams['state'] = stateId.toString();
      }
      if (productionId != null) {
        queryParams['production'] = productionId.toString();
      }

      final uri = Uri.https(
        'myanmarmarketapi.laziestant.tech',
        '/api/markets',
        queryParams.isNotEmpty ? queryParams : null,
      );

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      debugPrint('Error fetching markets: $e');
    }
    return [];
  }

  Future<void> _fetchMarkets() async {
    final markets = await _getMarkets(
      stateId: _selectedStateId,
      productionId: _selectedProductionId,
    );
    if (mounted) {
      setState(() {
        _markets = markets;
        // Reset selected market if it's not in the new list
        if (_selectedMarketName != null) {
          bool exists = _markets.any((m) {
            final name = m is String ? m : m['name'];
            return name == _selectedMarketName;
          });
          if (!exists) {
            _selectedMarketName = null;
          }
        }
      });
    }
  }

  Future<void> _fetchMarketData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      Uri uri;
      Map<String, String> queryParams = {};

      if (_selectedDate != null) {
        queryParams['date'] = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      }

      if (_selectedMarketName != null) {
        uri = Uri.https(
          'myanmarmarketapi.laziestant.tech',
          '/api/market/$_selectedMarketName',
          queryParams.isNotEmpty ? queryParams : null,
        );
      } else {
        if (_selectedStateId != null) {
          queryParams['state'] = _selectedStateId.toString();
        }
        if (_selectedProductionId != null) {
          queryParams['production'] = _selectedProductionId.toString();
        }

        uri = Uri.https(
          'myanmarmarketapi.laziestant.tech',
          '/api/market',
          queryParams.isNotEmpty ? queryParams : null,
        );
      }

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        setState(() {
          final data = json.decode(response.body);
          if (data is List) {
            _marketData = data;
          } else {
            _marketData = [data];
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = AppLocalizations.of(context)!.failedToLoadMarketData;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  void _showFilterModal() {
    // Initialize local state with current parent state
    int? tempStateId = _selectedStateId;
    int? tempProductionId = _selectedProductionId;
    String? tempMarketName = _selectedMarketName;
    DateTime? tempDate = _selectedDate;
    List<dynamic> tempMarkets = List.from(_markets);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            // Helper to refresh markets in modal
            Future<void> refreshModalMarkets() async {
              final markets = await _getMarkets(
                stateId: tempStateId,
                productionId: tempProductionId,
              );
              if (context.mounted) {
                setModalState(() {
                  tempMarkets = markets;
                  // Reset market selection if invalid
                  if (tempMarketName != null) {
                    bool exists = tempMarkets.any((m) {
                      final name = m is String ? m : m['name'];
                      return name == tempMarketName;
                    });
                    if (!exists) {
                      tempMarketName = null;
                    }
                  }
                });
              }
            }

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 100,
                top: 24,
                left: 24,
                right: 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppLocalizations.of(context)!.searchMarketPrices,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // State Selection
                  DropdownButtonFormField<int>(
                    decoration: InputDecoration(
                      labelText: AppLocalizations.of(context)!.selectRegion,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    value: tempStateId,
                    items: [
                      DropdownMenuItem<int>(
                        value: null,
                        child: Text(AppLocalizations.of(context)!.allRegions),
                      ),
                      ..._states.map((state) {
                        return DropdownMenuItem<int>(
                          value: state['id'],
                          child: Text(state['name']),
                        );
                      }),
                    ],
                    onChanged: (value) {
                      setModalState(() {
                        tempStateId = value;
                        tempMarketName = null;
                      });
                      refreshModalMarkets();
                    },
                  ),
                  const SizedBox(height: 16),

                  // Production Selection
                  DropdownButtonFormField<int>(
                    decoration: InputDecoration(
                      labelText:
                          AppLocalizations.of(context)!.selectProductType,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    value: tempProductionId,
                    items: [
                      DropdownMenuItem<int>(
                        value: null,
                        child: Text(
                          AppLocalizations.of(context)!.allProductTypes,
                        ),
                      ),
                      ..._productions.map((production) {
                        return DropdownMenuItem<int>(
                          value: production['id'],
                          child: Text(production['name']),
                        );
                      }),
                    ],
                    onChanged: (value) {
                      setModalState(() {
                        tempProductionId = value;
                        tempMarketName = null;
                      });
                      refreshModalMarkets();
                    },
                  ),
                  const SizedBox(height: 16),

                  // Market Selection
                  if (tempMarkets.isNotEmpty)
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: AppLocalizations.of(context)!.selectMarket,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      value: tempMarketName,
                      items: [
                        DropdownMenuItem<String>(
                          value: null,
                          child: Text(AppLocalizations.of(context)!.allMarkets),
                        ),
                        ...tempMarkets.map((market) {
                          final marketName =
                              market is String ? market : market['name'];
                          return DropdownMenuItem<String>(
                            value: marketName,
                            child: Text(marketName),
                          );
                        }),
                      ],
                      onChanged: (value) {
                        setModalState(() {
                          tempMarketName = value;
                        });
                      },
                    ),

                  const SizedBox(height: 16),

                  // Date Selection
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: tempDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setModalState(() {
                          tempDate = picked;
                        });
                      }
                    },
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: AppLocalizations.of(context)!.selectDate,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        suffixIcon: const Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        tempDate != null
                            ? DateFormat('yyyy-MM-dd').format(tempDate!)
                            : AppLocalizations.of(context)!.today,
                        style: TextStyle(
                          color: tempDate != null ? null : Colors.grey,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Apply filters
                      this.setState(() {
                        _selectedStateId = tempStateId;
                        _selectedProductionId = tempProductionId;
                        _selectedMarketName = tempMarketName;
                        _selectedDate = tempDate;
                        _markets = tempMarkets;
                      });
                      _fetchMarketData();
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      AppLocalizations.of(context)!.search,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? backgroundDark : backgroundLight;
    final surfaceColor = isDark ? surfaceDark : surfaceLight;
    final textMain = isDark ? textMainDark : textMainLight;
    final textMuted = isDark ? textMutedDark : textMutedLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: surfaceColor.withOpacity(0.95),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textMain),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          AppLocalizations.of(context)!.marketPrices,
          style: TextStyle(
            color: textMain,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.search, color: textMain),
            onPressed: _showFilterModal,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: isDark ? Colors.white10 : Colors.grey[200],
            height: 1,
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
        type: BottomNavigationBarType.fixed,
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: textMuted,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        onTap: (index) {
          if (index == 0) {
            Navigator.of(context).popUntil((route) => route.isFirst);
          } else if (index == 1) {
            Navigator.pop(context);
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: AppLocalizations.of(context)!.navHome,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.grid_view),
            activeIcon: const Icon(Icons.grid_view),
            label: AppLocalizations.of(context)!.navCategory,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.groups_outlined),
            activeIcon: const Icon(Icons.groups),
            label: AppLocalizations.of(context)!.navChatting,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: AppLocalizations.of(context)!.navSetting,
          ),
        ],
      ),
      body:
          _isLoading
              ? const Center(
                child: CircularProgressIndicator(color: primaryColor),
              )
              : _error.isNotEmpty
              ? Center(child: Text(_error, style: TextStyle(color: textMain)))
              : RefreshIndicator(
                onRefresh: _fetchMarketData,
                color: primaryColor,
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    // Date Banner
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      color:
                          isDark
                              ? primaryColor.withOpacity(0.05)
                              : primaryColor.withOpacity(0.1),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            color: primaryColor,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _selectedDate != null
                                ? AppLocalizations.of(context)!.pricesFor
                                : AppLocalizations.of(context)!.pricesForToday,
                            style: TextStyle(
                              color: textMain,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            DateFormat(
                              'MMM d',
                            ).format(_selectedDate ?? DateTime.now()),
                            style: TextStyle(
                              color: textMain,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Market List
                    if (_marketData.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 48.0,
                          horizontal: 24.0,
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 64,
                              color: textMuted.withOpacity(0.5),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              AppLocalizations.of(context)!.noMarketDataFound,
                              style: TextStyle(
                                color: textMain,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              AppLocalizations.of(
                                context,
                              )!.marketDataEmptyMessage,
                              style: TextStyle(color: textMuted, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    else
                      ..._marketData.map((market) {
                        return _buildMarketCard(
                          market,
                          surfaceColor,
                          textMain,
                          textMuted,
                          isDark,
                        );
                      }).toList(),

                    // Disclaimer
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color:
                            isDark
                                ? Colors.blue[900]!.withOpacity(0.1)
                                : Colors.blue[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              isDark
                                  ? Colors.blue[900]!.withOpacity(0.2)
                                  : Colors.blue[100]!,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: Colors.blue[500],
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  AppLocalizations.of(context)!.dataDisclaimer,
                                  style: TextStyle(
                                    color:
                                        isDark
                                            ? Colors.blue[100]
                                            : Colors.blue[900],
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  AppLocalizations.of(
                                    context,
                                  )!.marketDisclaimerText,
                                  style: TextStyle(
                                    color:
                                        isDark
                                            ? Colors.blue[300]
                                            : Colors.blue[800],
                                    fontSize: 12,
                                  ),
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
    );
  }

  Widget _buildMarketCard(
    Map<String, dynamic> market,
    Color surfaceColor,
    Color textMain,
    Color textMuted,
    bool isDark,
  ) {
    final items = market['items'] as List<dynamic>? ?? [];
    IconData marketIcon = Icons.warehouse;
    Color iconBgColor = Colors.blue[100]!;
    Color iconColor = Colors.blue[600]!;

    if (isDark) {
      iconBgColor = iconColor.withOpacity(0.2);
      iconColor = iconColor.withOpacity(0.8);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.all(16),
          childrenPadding: EdgeInsets.zero,
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(marketIcon, color: iconColor, size: 20),
          ),
          title: Text(
            market['market'] ?? AppLocalizations.of(context)!.unknownMarket,
            style: TextStyle(
              color: textMain,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          subtitle: Text(
            AppLocalizations.of(
              context,
            )!.marketRegion, // API doesn't seem to have region, using placeholder
            style: TextStyle(color: textMuted, fontSize: 12),
          ),
          children: [
            // Table Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: isDark ? Colors.black26 : Colors.grey[50],
              child: Row(
                children: [
                  Expanded(
                    flex: 5,
                    child: Text(
                      AppLocalizations.of(context)!.productHeader,
                      style: TextStyle(
                        color: textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      AppLocalizations.of(context)!.unitHeader,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        color: textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Text(
                      AppLocalizations.of(context)!.priceHeader,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        color: textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Items
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              separatorBuilder:
                  (context, index) => Divider(
                    height: 1,
                    color: isDark ? Colors.white10 : Colors.grey[100],
                  ),
              itemBuilder: (context, index) {
                final item = items[index];
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  color: isDark ? Colors.transparent : Colors.transparent,
                  child: Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          item['product'] ?? '',
                          style: TextStyle(
                            color: textMain,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          item['unit'] ?? '',
                          textAlign: TextAlign.right,
                          style: TextStyle(color: textMuted, fontSize: 12),
                        ),
                      ),
                      Expanded(
                        flex: 4,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              item['price'] ?? '',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                color: textMain,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            if (items.length > 5)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: isDark ? Colors.white10 : Colors.grey[100]!,
                    ),
                  ),
                ),
                child: Center(
                  child: Text(
                    AppLocalizations.of(context)!.viewAllItems(items.length),
                    style: const TextStyle(
                      color: primaryColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
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
