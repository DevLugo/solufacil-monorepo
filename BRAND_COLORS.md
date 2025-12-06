# Solufácil - Brand Colors

Paleta de colores oficial basada en el logo de Solufácil.

## Colores Principales

| Nombre | Hex | RGB | HSL | Uso |
|--------|-----|-----|-----|-----|
| **Naranja Solufácil** | `#F26522` | `rgb(242, 101, 34)` | `hsl(18, 87%, 54%)` | Primary - Ícono, CTAs, botones, acentos |
| **Azul Marino** | `#1A1A3E` | `rgb(26, 26, 62)` | `hsl(240, 38%, 17%)` | Secondary - Texto principal, fondos dark |
| **Blanco** | `#FFFFFF` | `rgb(255, 255, 255)` | `hsl(0, 0%, 100%)` | Fondos light, texto sobre naranja |

## Colores Derivados

### Light Mode
| Nombre | Hex | Uso |
|--------|-----|-----|
| Naranja Hover | `#FF7A33` | Hover states |
| Naranja Light | `#FFF4EE` | Backgrounds sutiles |
| Azul Marino Light | `#2A2A5E` | Texto secundario |

### Dark Mode
| Nombre | Hex | Uso |
|--------|-----|-----|
| Naranja Bright | `#FF7A42` | Primary en dark |
| Background Dark | `#14142B` | Fondo principal |
| Card Dark | `#1E1E3F` | Cards y superficies |
| Border Dark | `#2E2E5E` | Bordes |

## Colores de Estado

| Estado | Hex | Uso |
|--------|-----|-----|
| Success | `#22C55E` | Éxito, pagos completados |
| Warning | `#F59E0B` | Advertencias |
| Destructive | `#EF4444` | Errores, deuda vencida |
| Info | `#3B82F6` | Información |

## Gradientes

### Gradient Primary (Naranja)
```css
background: linear-gradient(135deg, #F26522 0%, #FF7A33 100%);
```

### Gradient Secondary (Azul Marino)
```css
background: linear-gradient(135deg, #1A1A3E 0%, #2A2A5E 100%);
```

### Gradient Brand
```css
background: linear-gradient(135deg, #E85A1C 0%, #F26522 50%, #FF7A33 100%);
```

## Uso en Flutter

```dart
class SolufacilColors {
  // Primary
  static const Color primary = Color(0xFFF26522);
  static const Color primaryLight = Color(0xFFFF7A33);
  static const Color primaryDark = Color(0xFFE85A1C);

  // Secondary
  static const Color secondary = Color(0xFF1A1A3E);
  static const Color secondaryLight = Color(0xFF2A2A5E);

  // Background
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF14142B);

  // Surface
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E1E3F);

  // Status
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
}
```

## Uso en CSS (Variables)

```css
:root {
  /* Primary - Naranja */
  --primary: 18 87% 54%;           /* #F26522 */
  --primary-foreground: 0 0% 100%;

  /* Secondary - Azul Marino */
  --secondary: 240 38% 17%;        /* #1A1A3E */
  --secondary-foreground: 0 0% 100%;

  /* Accent */
  --accent: 24 95% 58%;            /* #FF7A33 */
}

.dark {
  --background: 240 40% 9%;        /* #14142B */
  --foreground: 220 14% 96%;
}
```

## Logo

El logo de Solufácil consiste en:
1. **Rombo naranja** (`#F26522`) rotado 45°
2. **Dos líneas diagonales blancas** que forman una "S" estilizada
3. **Texto "Solufácil"**: "Solu" en Azul Marino, "fácil" en Naranja

### SVG del Ícono
```svg
<svg viewBox="0 0 40 40" fill="none">
  <rect x="6" y="6" width="28" height="28" rx="6" transform="rotate(45 20 20)" fill="#F26522"/>
  <path d="M12 28L28 12" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M12 20L20 12" stroke="white" stroke-width="3" stroke-linecap="round"/>
</svg>
```
