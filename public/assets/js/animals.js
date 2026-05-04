const $animalForm = document.querySelector('#animals-form');
const $displayArea = document.querySelector('#display-area');
const $status = document.querySelector('#animal-search-status');

function setStatus(message, tone = 'info') {
  if (!$status) {
    return;
  }

  if (!message) {
    $status.hidden = true;
    $status.textContent = '';
    return;
  }

  $status.className = `status status--${tone}`;
  $status.textContent = message;
  $status.hidden = false;
}

function buildErrorMessage(responseText, statusText) {
  if (!responseText) {
    return statusText;
  }

  try {
    const payload = JSON.parse(responseText);
    return payload.error || payload.message || statusText;
  } catch {
    return responseText || statusText;
  }
}

const printResults = resultArr => {
  if (!Array.isArray(resultArr) || resultArr.length === 0) {
    setStatus('No animals match those filters.', 'empty');
    $displayArea.replaceChildren();
    return;
  }

  const rows = resultArr.map(animal => {
    const { id, name, personalityTraits, species, diet } = animal;

    const column = document.createElement('div');
    column.className = 'col-12 col-md-5 mb-3';

    const card = document.createElement('article');
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
        : 'None listed';

    const speciesRow = document.createElement('span');
    speciesRow.textContent = `Species: ${speciesValue ? speciesValue : 'Unspecified'}`;
    const br = document.createElement('br');
    const dietRow = document.createElement('span');
    dietRow.textContent = `Diet: ${dietValue ? dietValue : 'Unspecified'}`;
    const br2 = document.createElement('br');
    const traitsRow = document.createElement('span');
    traitsRow.textContent = `Personality Traits: ${traitsValue}`;

    details.append(speciesRow, br, dietRow, br2, traitsRow);
    card.append(heading, details);
    column.appendChild(card);

    return column;
  });

  setStatus('', '');
  $displayArea.replaceChildren(...rows);
};

const getAnimals = (formData = {}) => {
  const query = new URLSearchParams();
  const submitButton = $animalForm?.querySelector('button[type="submit"]');
  const previousLabel = submitButton ? submitButton.textContent : '';

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  const endpoint = `/api/animals${queryString ? `?${queryString}` : ''}`;

  setStatus('Loading animals...', 'info');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
  }

  fetch(endpoint)
    .then(async response => {
      const responseText = await response.text();
      if (!response.ok) {
        const message = buildErrorMessage(responseText, response.statusText);
        setStatus(`Error: ${message}`, 'error');
        return [];
      }

      return responseText ? JSON.parse(responseText) : [];
    })
    .then(animalData => {
      if (!animalData) {
        return;
      }
      printResults(animalData);
    })
    .finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    });
};

const handleGetAnimalsSubmit = event => {
  event.preventDefault();

  const diet = getDietValue();
  const personalityTraits = readPersonalityTraits();

  const animalObject = { diet, personalityTraits };

  getAnimals(animalObject);
};

function getDietValue() {
  const dietRadioHTML = $animalForm.querySelectorAll('[name="diet"]');
  for (let i = 0; i < dietRadioHTML.length; i += 1) {
    if (dietRadioHTML[i].checked) {
      return dietRadioHTML[i].value;
    }
  }

  return '';
}

function readPersonalityTraits() {
  const selectedTraits = $animalForm.querySelector('[name="personality"]').selectedOptions;
  const personalityTraitArr = [];

  for (let i = 0; i < selectedTraits.length; i += 1) {
    personalityTraitArr.push(selectedTraits[i].value);
  }

  return personalityTraitArr.join(',');
}

$animalForm.addEventListener('submit', handleGetAnimalsSubmit);

getAnimals();
