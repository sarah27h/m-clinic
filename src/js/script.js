const benefitsTabs = document.querySelector('.benefits__tabs');
const benefitsTab = document.getElementsByClassName('js-benefits__tab');
const benefitsService = document.getElementsByClassName('benefits__service');

console.log(benefitsTab);
console.log(benefitsService);

benefitsTabs.addEventListener('click', (e) => {
  if (e.target.nodeName.toLowerCase() === 'span') {
    const clickedTab = e.target;
    Array.from(benefitsTab).forEach((benefitTab) => {
      benefitTab.classList.remove('active');
    });
    clickedTab.classList.add('active');

    Array.from(benefitsService).forEach((benefitService) => {
      benefitService.classList.remove('show');
      benefitService.classList.add('hide');
      if (benefitService.getAttribute('id') === clickedTab.getAttribute('data-filter')) {
        benefitService.classList.remove('hide');
        benefitService.classList.add('show');
      }
    });
  }
});
