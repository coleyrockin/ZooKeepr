const $animalForm = document.querySelector('#animal-form');
const $zookeeperForm = document.querySelector('#zookeeper-form');

const $animalStatus = document.querySelector('#animal-form-status');
const $zookeeperStatus = document.querySelector('#zookeeper-form-status');

function setStatus($status, message, tone = 'info') {
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

function readFormTraitValues($form, fieldName) {
  const selectedTraits = $form.querySelector(`[name="${fieldName}"]`)?.selectedOptions || [];
  const traits = [];

  for (let i = 0; i < selectedTraits.length; i += 1) {
    traits.push(selectedTraits[i].value);
  }

  return traits;
}

function getDietValue($form) {
  const dietRadioHTML = $form.querySelectorAll('[name="diet"]');

  for (let i = 0; i < dietRadioHTML.length; i += 1) {
    if (dietRadioHTML[i].checked) {
      return dietRadioHTML[i].value;
    }
  }

  return '';
}

async function submitJson(endpoint, payload, statusNode, submitButton, formToReset) {
  const previousLabel = submitButton?.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';
  setStatus(statusNode, 'Submitting your record...', 'info');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      const message = buildErrorMessage(responseText, response.statusText);
      setStatus(statusNode, `Error: ${message}`, 'error');
      return;
    }

    const parsed = responseText ? JSON.parse(responseText) : null;
    setStatus(statusNode, `Saved: ${parsed?.name || 'Record created'} (ID ${parsed?.id || 'new'})`, 'success');
    if (formToReset) {
      formToReset.reset();
    }
  } catch (error) {
    setStatus(statusNode, `Network error: ${error.message}`, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = previousLabel;
  }
}

const handleAnimalFormSubmit = event => {
  event.preventDefault();

  const name = $animalForm.querySelector('[name="animal-name"]').value.trim();
  const species = $animalForm.querySelector('[name="species"]').value.trim();
  const diet = getDietValue($animalForm);
  const personalityTraits = readFormTraitValues($animalForm, 'personality');

  const animalObject = { name, species, diet, personalityTraits };
  const submitButton = $animalForm.querySelector('button[type="submit"]');
  submitJson('api/animals', animalObject, $animalStatus, submitButton, $animalForm);
};

const handleZookeeperFormSubmit = event => {
  event.preventDefault();

  const name = $zookeeperForm.querySelector('[name="zookeeper-name"]').value.trim();
  const age = parseInt($zookeeperForm.querySelector('[name="age"]').value, 10);
  const favoriteAnimal = $zookeeperForm.querySelector('[name="favorite-animal"]').value.trim();
  const zookeeperObj = { name, age, favoriteAnimal };
  const submitButton = $zookeeperForm.querySelector('button[type="submit"]');

  submitJson('api/zookeepers', zookeeperObj, $zookeeperStatus, submitButton, $zookeeperForm);
};

$animalForm.addEventListener('submit', handleAnimalFormSubmit);
$zookeeperForm.addEventListener('submit', handleZookeeperFormSubmit);
