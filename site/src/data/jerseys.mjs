import jersey01 from '../assets/jerseys/jersey-01.jpg';
import jersey02 from '../assets/jerseys/jersey-02.jpg';
import jersey03 from '../assets/jerseys/jersey-03.jpg';
import jersey04 from '../assets/jerseys/jersey-04.jpg';
import jersey05 from '../assets/jerseys/jersey-05.jpg';
import jersey06 from '../assets/jerseys/jersey-06.jpg';
import jersey07 from '../assets/jerseys/jersey-07.jpg';
import jersey08 from '../assets/jerseys/jersey-08.jpg';
import jersey09 from '../assets/jerseys/jersey-09.jpg';
import jersey10 from '../assets/jerseys/jersey-10.jpg';
import jersey11 from '../assets/jerseys/jersey-11.jpg';
import jersey12 from '../assets/jerseys/jersey-12.jpg';

export const jerseys = [
  { slug: 'jersey-01', image: jersey01, nameKey: 'jersey.n1' },
  { slug: 'jersey-02', image: jersey02, nameKey: 'jersey.n2' },
  { slug: 'jersey-03', image: jersey03, nameKey: 'jersey.n3' },
  { slug: 'jersey-04', image: jersey04, nameKey: 'jersey.n4' },
  { slug: 'jersey-05', image: jersey05, nameKey: 'jersey.n5' },
  { slug: 'jersey-06', image: jersey06, nameKey: 'jersey.n6' },
  { slug: 'jersey-07', image: jersey07, nameKey: 'jersey.n7' },
  { slug: 'jersey-08', image: jersey08, nameKey: 'jersey.n8' },
  { slug: 'jersey-09', image: jersey09, nameKey: 'jersey.n9' },
  { slug: 'jersey-10', image: jersey10, nameKey: 'jersey.n10' },
  { slug: 'jersey-11', image: jersey11, nameKey: 'jersey.n11' },
  { slug: 'jersey-12', image: jersey12, nameKey: 'jersey.n12' },
];

export const jerseyBySlug = (slug) => jerseys.find((jersey) => jersey.slug === slug);
