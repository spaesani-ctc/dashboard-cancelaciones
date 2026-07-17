# Guías de diseño del dashboard

Destilado operativo de la **Guía de visualización de datos (FEMP)** y del **Visual Vocabulary (FT, ed. español)**. Toda modificación al dashboard debe chequearse contra esto.

## Elección de gráfico (Visual Vocabulary)
- **Cambio en el tiempo** → columnas / línea (Evolución semanal: columnas para volumen + línea para tasa).
- **Ranking / magnitud** → barras ordenadas, horizontales si los nombres son largos (Motivos, Categorías).
- **Parte de un todo** → apilado o treemap (semanal por categoría, treemap de motivos).
- **Matriz X×Y con intensidad** → heatmap **siempre con valores en las celdas** (el degradado nunca es el único canal).
- Antes de agregar un gráfico nuevo: identificar qué relación muestra y elegir de la familia correspondiente.

## Principios FEMP aplicados
1. **Simplificación**: sin bordes/sombras/3D, sin fondos con textura, grid mínimo (solo eje Y del semanal, porque las etiquetas de valor se ocultan en rangos largos), sin palabras redundantes en títulos.
2. **Percepción fidedigna**: ejes desde cero; etiquetas siempre horizontales (maxRotation 0).
3. **Etiquetas directas** sobre las barras cuando hay ≤15 puntos; con más puntos, ejes.
4. **Decimales**: máximo 1 en porcentajes; enteros para conteos; separadores es-AR.
5. **Uniformidad**: un color = un significado en TODO el tablero (ver tabla).
6. **Color**:
   - Máximo ~5 grupos por color en un mismo gráfico → el apilado por categoría muestra top 5 + "Resto" (gris).
   - El color nunca es el único canal: todo semáforo va acompañado del valor numérico.
   - Saturación media; variantes por luminosidad (familia coral: claro=volumen, oscuro=tasa).
7. **Accesibilidad**: contraste texto/fondo AA; el par coral/teal del semáforo de % es rojo-verde (riesgo daltonismo) — aceptado porque el número siempre está visible; no introducir señales solo-color nuevas.

## Tabla de colores semánticos
| Significado | Var | Light |
|---|---|---|
| Cancelación (volumen) | `--coral-l` | #F0997B |
| Cancelación (tasa/severo) | `--coral` / `--burdeos` | #D85A30 / #7E2F33 |
| Positivo (dictadas, tasa baja) | `--teal` | #1D9E75 |
| Alerta media (<24h, tasa media) | `--amber` | #BA7517 |
| Categorías | IE coral · Externo pizarra · Docente CTC ámbar · CTC burdeos · Operativo teal · Otro cuero · N/A gris · Sin categoría gris claro |
| Neutro / sin dato | `--ink3` / `--ink4` | grises |

## Tipografía
Lora (títulos) · Poppins Bold (KPIs, títulos de panel) · Mulish (cuerpo y gráficos) · Gabarito (etiquetas, headers de tabla) · Inter (metadata).

## Reglas de producto
- Todo % agregado se calcula sumando numerador y denominador (nunca promedio de %s).
- El % de cancelación es neto (canceladas − recuperaciones dictadas) — documentado en Metodología.
- Cada visualización exporta su dato (Excel) y su imagen (PNG) cuando aplica.
- Máx. ~11 columnas visibles por tabla; más detalle va a lentes o al export.
