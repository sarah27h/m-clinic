import { tns } from '../../node_modules/tiny-slider/src/tiny-slider';

const slider = tns({
  container: '.testmonials__slider',
  items: 3,
  slideBy: 'page',
  autoplay: true,
  responsive: {
    319: {
      items: 1,
      nav: false,
    },
    500: {
      items: 2,
      gutter: 30,
      nav: true,
    },
    900: {
      items: 3,
    },
  },
  controls: false,
  navPosition: 'bottom',
  mouseDrag: true,
  autoplayButtonOutput: false,
});
