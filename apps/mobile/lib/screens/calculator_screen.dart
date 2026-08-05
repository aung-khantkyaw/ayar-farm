import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:math_expressions/math_expressions.dart' hide Stack;

class CalculatorScreen extends StatefulWidget {
  const CalculatorScreen({super.key});

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
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

  // Calculator State
  String _expression = '';
  String _result = '0';
  final List<String> _buttons = [
    'AC',
    '⌫',
    '%',
    '÷',
    '7',
    '8',
    '9',
    '×',
    '4',
    '5',
    '6',
    '-',
    '1',
    '2',
    '3',
    '+',
    '0',
    '.',
    '=',
  ];

  // Unit Converter State
  String _selectedCategory = 'Area';
  final List<String> _categories = ['Area', 'Weight', 'Temperature', 'Liquid'];

  String _fromUnit = 'Hectare';
  String _toUnit = 'Acre';
  final TextEditingController _fromController = TextEditingController(
    text: '1',
  );
  final TextEditingController _toController = TextEditingController();

  // Unit Definitions
  final Map<String, List<String>> _units = {
    'Area': ['Hectare', 'Acre', 'Sq Meter', 'Sq Foot'],
    'Weight': ['Kg', 'Lb', 'Ton', 'Gram'],
    'Temperature': ['Celsius', 'Fahrenheit', 'Kelvin'],
    'Liquid': ['Liter', 'Gallon', 'Milliliter'],
  };

  final Map<String, Map<String, double>> _conversions = {
    // Area (Base: Sq Meter)
    'Hectare': {'toBase': 10000},
    'Acre': {'toBase': 4046.86},
    'Sq Meter': {'toBase': 1},
    'Sq Foot': {'toBase': 0.092903},

    // Weight (Base: Kg)
    'Kg': {'toBase': 1},
    'Lb': {'toBase': 0.453592},
    'Ton': {'toBase': 1000},
    'Gram': {'toBase': 0.001},

    // Liquid (Base: Liter)
    'Liter': {'toBase': 1},
    'Gallon': {'toBase': 3.78541},
    'Milliliter': {'toBase': 0.001},
  };

  @override
  void initState() {
    super.initState();
    _convert();
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }

  // Calculator Logic
  void _onCalculatorPressed(String buttonText) {
    setState(() {
      if (buttonText == 'AC') {
        _expression = '';
        _result = '0';
      } else if (buttonText == '⌫') {
        if (_expression.isNotEmpty) {
          _expression = _expression.substring(0, _expression.length - 1);
        }
      } else if (buttonText == '=') {
        _evaluateExpression();
      } else {
        if (_expression == 'Error') {
          _expression = buttonText;
        } else {
          _expression += buttonText;
        }
      }
    });
  }

  void _evaluateExpression() {
    try {
      String finalExpression = _expression;
      finalExpression = finalExpression.replaceAll('×', '*');
      finalExpression = finalExpression.replaceAll('÷', '/');

      // Handle percentage: number% -> (number/100)
      // This is a simple replacement, might need more complex parsing for "100 + 10%"
      // But for "1250 * 15%", replacing 15% with (15/100) works.
      finalExpression = finalExpression.replaceAllMapped(
        RegExp(r'(\d+(\.\d+)?)%'),
        (match) {
          return '(${match.group(1)}/100)';
        },
      );

      Parser p = Parser();
      Expression exp = p.parse(finalExpression);
      ContextModel cm = ContextModel();
      double eval = exp.evaluate(EvaluationType.REAL, cm);

      setState(() {
        _result = eval.toString();
        // Remove trailing .0
        if (_result.endsWith('.0')) {
          _result = _result.substring(0, _result.length - 2);
        }
      });
    } catch (e) {
      setState(() {
        _result = 'Error';
      });
    }
  }

  // Unit Converter Logic
  void _convert() {
    if (_fromController.text.isEmpty) {
      _toController.text = '';
      return;
    }

    double? input = double.tryParse(_fromController.text);
    if (input == null) return;

    double result = 0;

    if (_selectedCategory == 'Temperature') {
      result = _convertTemperature(input, _fromUnit, _toUnit);
    } else {
      // Standard conversion using base unit
      double toBase = _conversions[_fromUnit]!['toBase']!;
      double fromBase = _conversions[_toUnit]!['toBase']!;

      // input * toBase = baseValue
      // baseValue / fromBase = output
      result = (input * toBase) / fromBase;
    }

    setState(() {
      _toController.text = result
          .toStringAsFixed(4)
          .replaceAll(RegExp(r'([.]*0)(?!.*\d)'), '');
    });
  }

  double _convertTemperature(double input, String from, String to) {
    if (from == to) return input;

    // Convert to Celsius first
    double celsius;
    if (from == 'Celsius')
      celsius = input;
    else if (from == 'Fahrenheit')
      celsius = (input - 32) * 5 / 9;
    else if (from == 'Kelvin')
      celsius = input - 273.15;
    else
      celsius = input;

    // Convert from Celsius to target
    if (to == 'Celsius') return celsius;
    if (to == 'Fahrenheit') return (celsius * 9 / 5) + 32;
    if (to == 'Kelvin') return celsius + 273.15;

    return celsius;
  }

  void _swapUnits() {
    setState(() {
      String temp = _fromUnit;
      _fromUnit = _toUnit;
      _toUnit = temp;
      _convert();
    });
  }

  void _changeCategory(String category) {
    setState(() {
      _selectedCategory = category;
      _fromUnit = _units[category]![0];
      _toUnit = _units[category]![1];
      _convert();
    });
  }

  String _getLocalized(BuildContext context, String key) {
    final loc = AppLocalizations.of(context)!;
    switch (key) {
      case 'Area':
        return loc.area;
      case 'Weight':
        return loc.weight;
      case 'Temperature':
        return loc.temperature;
      case 'Liquid':
        return loc.liquid;
      case 'Hectare':
        return loc.hectare;
      case 'Acre':
        return loc.acre;
      case 'Sq Meter':
        return loc.sqMeter;
      case 'Sq Foot':
        return loc.sqFoot;
      case 'Kg':
        return loc.kg;
      case 'Lb':
        return loc.lb;
      case 'Ton':
        return loc.ton;
      case 'Gram':
        return loc.gram;
      case 'Celsius':
        return loc.celsius;
      case 'Fahrenheit':
        return loc.fahrenheit;
      case 'Kelvin':
        return loc.kelvin;
      case 'Liter':
        return loc.liter;
      case 'Gallon':
        return loc.gallon;
      case 'Milliliter':
        return loc.milliliter;
      default:
        return key;
    }
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
          AppLocalizations.of(context)!.agriCalculator,
          style: TextStyle(
            color: textMain,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: isDark ? Colors.white10 : Colors.grey[200],
            height: 1,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Calculator Section
            Container(
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Display
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 2,
                          offset: const Offset(0, 1),
                          blurStyle: BlurStyle.inner,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _expression.isEmpty ? '0' : _expression,
                          style: TextStyle(
                            color: textMuted,
                            fontSize: 14,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _result,
                          style: TextStyle(
                            color: textMain,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Buttons Grid
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1,
                        ),
                    itemCount: _buttons.length,
                    itemBuilder: (context, index) {
                      final btnText = _buttons[index];
                      final isOperator = [
                        '÷',
                        '×',
                        '-',
                        '+',
                        '=',
                      ].contains(btnText);
                      final isAction = ['AC', '⌫', '%'].contains(btnText);
                      final isEquals = btnText == '=';

                      Color btnBg = surfaceColor;
                      Color btnTextCol = textMain;

                      if (isEquals) {
                        btnBg = primaryColor;
                        btnTextCol = Colors.black;
                      } else if (isOperator) {
                        btnBg = primaryColor.withOpacity(0.1);
                        btnTextCol = primaryColor;
                      } else if (isAction) {
                        if (btnText == 'AC') {
                          btnBg = Colors.red.withOpacity(0.1);
                          btnTextCol = Colors.red;
                        } else {
                          btnBg = bgColor;
                        }
                      } else {
                        // Numbers
                        btnBg = surfaceColor;
                        // Add border for numbers to match design slightly
                      }

                      return Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => _onCalculatorPressed(btnText),
                          borderRadius: BorderRadius.circular(50),
                          child: Container(
                            decoration: BoxDecoration(
                              color: btnBg,
                              shape: BoxShape.circle,
                              border:
                                  (!isEquals && !isOperator && !isAction)
                                      ? Border.all(
                                        color:
                                            isDark
                                                ? Colors.white10
                                                : Colors.grey[200]!,
                                      )
                                      : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              btnText,
                              style: TextStyle(
                                color: btnTextCol,
                                fontSize: 20,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Unit Converter Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  AppLocalizations.of(context)!.unitConverter,
                  style: TextStyle(
                    color: textMain,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _fromController.text = '1';
                      _convert();
                    });
                  },
                  child: Text(
                    AppLocalizations.of(context)!.reset,
                    style: TextStyle(
                      color: primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Container(
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Categories
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children:
                          _categories.map((category) {
                            final isSelected = _selectedCategory == category;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: InkWell(
                                onTap: () => _changeCategory(category),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSelected ? primaryColor : bgColor,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _getLocalized(context, category),
                                    style: TextStyle(
                                      color:
                                          isSelected ? Colors.black : textMuted,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Converter Inputs
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Column(
                        children: [
                          // From
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppLocalizations.of(context)!.from,
                                style: TextStyle(
                                  color: textMuted,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    flex: 2,
                                    child: TextField(
                                      controller: _fromController,
                                      keyboardType: TextInputType.number,
                                      style: TextStyle(
                                        color: textMain,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      decoration: InputDecoration(
                                        filled: true,
                                        fillColor: bgColor,
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          borderSide: BorderSide.none,
                                        ),
                                        contentPadding: const EdgeInsets.all(
                                          16,
                                        ),
                                      ),
                                      onChanged: (val) => _convert(),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    flex: 1,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: bgColor,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _fromUnit,
                                          isExpanded: true,
                                          icon: const Icon(
                                            Icons.keyboard_arrow_down,
                                          ),
                                          style: TextStyle(
                                            color: textMain,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          items:
                                              _units[_selectedCategory]!.map((
                                                String value,
                                              ) {
                                                return DropdownMenuItem<String>(
                                                  value: value,
                                                  child: Text(
                                                    _getLocalized(
                                                      context,
                                                      value,
                                                    ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                );
                                              }).toList(),
                                          onChanged: (newValue) {
                                            setState(() {
                                              _fromUnit = newValue!;
                                              _convert();
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          // To
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppLocalizations.of(context)!.to,
                                style: TextStyle(
                                  color: textMuted,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    flex: 2,
                                    child: TextField(
                                      controller: _toController,
                                      readOnly: true,
                                      style: TextStyle(
                                        color: textMain.withOpacity(0.7),
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      decoration: InputDecoration(
                                        filled: true,
                                        fillColor:
                                            isDark
                                                ? Colors.black26
                                                : Colors.grey[100],
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          borderSide: BorderSide.none,
                                        ),
                                        contentPadding: const EdgeInsets.all(
                                          16,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    flex: 1,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: bgColor,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _toUnit,
                                          isExpanded: true,
                                          icon: const Icon(
                                            Icons.keyboard_arrow_down,
                                          ),
                                          style: TextStyle(
                                            color: textMain,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          items:
                                              _units[_selectedCategory]!.map((
                                                String value,
                                              ) {
                                                return DropdownMenuItem<String>(
                                                  value: value,
                                                  child: Text(
                                                    _getLocalized(
                                                      context,
                                                      value,
                                                    ),
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                );
                                              }).toList(),
                                          onChanged: (newValue) {
                                            setState(() {
                                              _toUnit = newValue!;
                                              _convert();
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                      // Swap Button
                      Positioned(
                        child: Transform.translate(
                          offset: const Offset(0, 12),
                          child: InkWell(
                            onTap: _swapUnits,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: surfaceColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color:
                                      isDark
                                          ? Colors.white10
                                          : Colors.grey[200]!,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.swap_vert,
                                color: primaryColor,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
