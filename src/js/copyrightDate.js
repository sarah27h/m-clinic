// get year updated using getFullYear() js function
const copyrightYearear = document.getElementById('update_year');
const theCurrentDate = new Date();

const theCurrentYear = theCurrentDate.getFullYear();
copyrightYearear.textContent = theCurrentYear;
