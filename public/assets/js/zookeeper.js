const $zookeeperForm = document.querySelector('#zookeeper-form');
const $displayArea = document.querySelector('#display-area');

const printResults = resultArr => {
  console.log(resultArr);

  const rows = resultArr.map(zookeeper => {
    const { id, name, age, favoriteAnimal } = zookeeper;

    const column = document.createElement('div');
    column.className = 'col-12 col-md-5 mb-3';

    const card = document.createElement('div');
    card.className = 'card p-3';
    card.dataset.id = String(id || '');

    const heading = document.createElement('h4');
    heading.className = 'text-primary';
    heading.textContent = String(name || '');

    const details = document.createElement('p');
    const favorite = String(favoriteAnimal || '');
    const ageText = document.createElement('span');
    ageText.textContent = `Age: ${String(age || '')}`;

    const br = document.createElement('br');
    const favoriteText = document.createElement('span');
    favoriteText.textContent = `Favorite Animal: ${favorite.charAt(0).toUpperCase() + favorite.slice(1)}`;

    details.append(ageText, br, favoriteText);
    card.append(heading, details);
    column.appendChild(card);

    return column;
  });

  $displayArea.replaceChildren(...rows);
};

const getZookeepers = (formData = {}) => {
  const query = new URLSearchParams();

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryUrl = `/api/zookeepers?${query.toString()}`;
  fetch(queryUrl)
    .then(response => {
      if (!response.ok) {
        return alert(`Error: ${response.statusText}`);
      }
      return response.json();
    })
    .then(zookeeperArr => {
      console.log(zookeeperArr);
      printResults(zookeeperArr);
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
