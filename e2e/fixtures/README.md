# Test Fixtures

Esta carpeta contiene archivos de prueba para los tests E2E.

## Crear imagen de prueba

Para los tests E2E que requieren subir imágenes, necesitas una imagen de prueba.

Puedes crear una usando este comando (requiere ImageMagick):

```bash
convert -size 800x600 xc:white -gravity center -pointsize 40 -annotate +0+0 "Test Image" test-image.jpg
```

O simplemente coloca cualquier imagen JPG con el nombre `test-image.jpg` en esta carpeta.

## Estructura recomendada

```
e2e/fixtures/
  ├── test-image.jpg       # Imagen de prueba para uploads
  ├── test-image-large.jpg # Imagen grande para test de límites
  └── README.md            # Este archivo
```
