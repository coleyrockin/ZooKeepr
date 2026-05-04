const $zookeeperForm = document.querySelector('#zookeeper-form');
const $displayArea = document.querySelector('#display-area');
const $status = document.querySelector('#zookeeper-search-status');

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
    setStatus('No zookeepers match those filters.', 'empty');
    $displayArea.replaceChildren();
    return;
  }

  const rows = resultArr.map(zookeeper => {
    const { id, name, age, favoriteAnimal } = zookeeper;

    const column = document.createElement('div');
    column.className = 'col-12 col-md-5 mb-3';

    const card = document.createElement('article');
    card.className = 'card p-3';
    card.dataset.id = String(id || '');

    const heading = document.createElement('h4');
    heading.className = 'text-primary';
    heading.textContent = String(name || '');

    const details = document.createElement('p');
    const favorite = String(favoriteAnimal || '');

    const ageText = document.createElement('span');
    ageText.textContent = `Age: ${age ?? ''}`;

    const br = document.createElement('br');
    const favoriteText = document.createElement('span');
    favoriteText.textContent = `Favorite Animal: ${favorite ? favorite.charAt(0).toUpperCase() + favorite.slice(1) : ''}`;

    details.append(ageText, br, favoriteText);
    card.append(heading, details);
    column.appendChild(card);

    return column;
  });

  setStatus('', '');
  $displayArea.replaceChildren(...rows);
};

const getZookeepers = (formData = {}) => {
  const query = new URLSearchParams();
  const submitButton = $zookeeperForm?.querySelector('button[type="submit"]');
  const previousLabel = submitButton ? submitButton.textContent : '';

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  const queryUrl = `/api/zookeepers${queryString ? `?${queryString}` : ''}`;

  setStatus('Loading zookeepers...', 'info');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
  }

  fetch(queryUrl)
    .then(async response => {
      const responseText = await response.text();
      if (!response.ok) {
        const message = buildErrorMessage(responseText, response.statusText);
        setStatus(`Error: ${message}`, 'error');
        return [];
      }
      return responseText ? JSON.parse(responseText) : [];
    })
    .then(zookeeperArr => {
      if (!zookeeperArr) {
        return;
      }
      printResults(zookeeperArr);
    })
    .finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    });
};

const handleGetZookeepersSubmit = event => {
  event.preventDefault();

  const nameHTML = $zookeeperForm.querySelector('[name="name"]');
  const name = nameHTML.value;

  const ageHTML = $zookeeperForm.querySelector('[name="age"]');
  const age = ageHTML.value;

  const zookeeperObject = { name, age };

  getZookeepers(zookeeperObject);
};

$zookeeperForm.addEventListener('submit', handleGetZookeepersSubmit);

getZookeepers();
