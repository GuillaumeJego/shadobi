// =========================================================
// RÉDUCTION DES IMAGES AVANT ENVOI
//
// Une photo de téléphone (3 à 5 Mo) est redimensionnée à
// 1600 px maximum et recompressée en JPEG : quelques
// centaines de Ko, sans perte visible sur le site.
// =========================================================

const TAILLE_MAX = 1600;
const QUALITE = 0.82;

export async function imagePourLeWeb(fichier: File): Promise<Blob> {
  // Les GIF (animés) sont envoyés tels quels.
  if (fichier.type === 'image/gif') return fichier;

  const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });

  const echelle = Math.min(1, TAILLE_MAX / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * echelle);
  const hauteur = Math.round(image.height * echelle);

  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  canvas.getContext('2d')!.drawImage(image, 0, 0, largeur, hauteur);
  image.close();

  const blob = await new Promise<Blob | null>(ok => canvas.toBlob(ok, 'image/jpeg', QUALITE));

  // Si la réduction n'apporte rien (image déjà petite), on garde l'original.
  return blob && blob.size < fichier.size ? blob : fichier;
}
