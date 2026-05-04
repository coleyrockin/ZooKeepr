const $animalForm = document.querySelector('#animals-form');
const $displayArea = document.querySelector('#display-area');

const printResults = resultArr => {
  console.log(resultArr);

  const rows = resultArr.map(animal => {
    const { id, name, personalityTraits, species, diet } = animal;

    const column = document.createElement('div');
    column.className = 'col-12 col-md-5 mb-3';

    const card = document.createElement('div');
    card.className = 'card p-3';
    card.dataset.id = String(id || '');

    const heading = document.createElement('h4');
    heading.className = 'text-primary';
    heading.textContent = String(name || '');

    const details = document.createElement('p');
    const speciesValue = String(species || '');
    const dietValue = String(diet || '');
    const traitsValue =
      Array.isArray(personalityTraits) && personalityTraits.length > 0
        ? personalityTraits.map(trait => String(trait || '')).join(', ')
        : '';

    const speciesRow = document.createElement('span');
    speciesRow.textContent = `Species: ${speciesValue.charAt(0).toUpperCase() + speciesValue.slice(1)}`;
    const br = document.createElement('br');
    const dietRow = document.createElement('span');
    dietRow.textContent = `Diet: ${dietValue.charAt(0).toUpperCase() + dietValue.slice(1)}`;
    const br2 = document.createElement('br');
    const traitsRow = document.createElement('span');
    traitsRow.textContent = `Personality Traits: ${traitsValue}`;

    details.append(speciesRow, br, dietRow, br2, traitsRow);
    card.append(heading, details);
    column.appendChild(card);

    return column;
  });

  $displayArea.replaceChildren(...rows);
};

const getAnimals = (formData = {}) => {
  const query = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryUrl = `/api/animals?${query.toString()}`;
  console.log(queryUrl);

  fetch(queryUrl)
    .then(response => {
      if (!response.ok) {
        return alert('Error: ' + response.statusText);
      }
      return response.json();
    })
    .then(animalData => {
      console.log(animalData);
      printResults(animalData);
    });
};

const handleGetAnimalsSubmit = event => {
  event.preventDefault();
  const dietRadioHTML = $animalForm.querySelectorAll('[name="diet"]');
  let diet;

  for (let i = 0; i < dietRadioHTML.length; i += 1) {
    if (dietRadioHTML[i].checked) {
      diet = dietRadioHTML[i].value;
    }
  }

  if (diet === undefined) {
    diet = '';
  }

  const personalityTraitArr = [];
  const selectedTraits = $animalForm.querySelector('[name="personality"]').selectedOptions;

  for (let i = 0; i < selectedTraits.length; i += 1) {
    personalityTraitArr.push(selectedTraits[i].value);
  }

  const personalityTraits = personalityTraitArr.join(',');

  const animalObject = { diet, personalityTraits };

  getAnimals(animalObject);
};

$animalForm.addEventListener('submit', handleGetAnimalsSubmit);

getAnimals();
