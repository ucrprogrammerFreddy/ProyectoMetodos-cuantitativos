const arrivals = [
  { demand: 0, lower: 0.0, upper: 0.13 },
  { demand: 1, lower: 0.13, upper: 0.3 },
  { demand: 2, lower: 0.3, upper: 0.45 },
  { demand: 3, lower: 0.45, upper: 0.7 },
  { demand: 4, lower: 0.7, upper: 0.9 },
  { demand: 5, lower: 0.9, upper: 1.0 },
];

const unloadingRates = [
  { unload: 1, lower: 0.0, upper: 0.05 },
  { unload: 2, lower: 0.05, upper: 0.2 },
  { unload: 3, lower: 0.2, upper: 0.7 },
  { unload: 4, lower: 0.7, upper: 0.9 },
  { unload: 5, lower: 0.9, upper: 1.0 },
];

const lookupValue = (random, table) =>
  table.find((item) => random >= item.lower && random < item.upper);

document.getElementById("simulationForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const days = parseInt(document.getElementById("days").value);
  const tableBody = document.getElementById("simulationTableBody");
  tableBody.innerHTML = "";

  let previousDelays = 0;
  for (let day = 1; day <= days; day++) {
    const randomArrival = Math.random().toFixed(4);
    const randomUnload = Math.random().toFixed(4);

    const arrivalData = lookupValue(randomArrival, arrivals);
    const unloadData = lookupValue(randomUnload, unloadingRates);

    const arrivalsValue = arrivalData ? arrivalData.demand : 0;
    const possibleUnload = unloadData ? unloadData.unload : 0;

    const totalToUnload = previousDelays + arrivalsValue;
    const actualUnload = Math.min(totalToUnload, possibleUnload);
    const newDelays = totalToUnload - actualUnload;

    const row = `
      <tr>
        <td>${day}</td>
        <td contenteditable="true" class="editable previous-delays">${previousDelays}</td>
        <td>${randomArrival}</td>
        <td contenteditable="true" class="editable arrivals">${arrivalsValue}</td>
        <td>${totalToUnload}</td>
        <td>${randomUnload}</td>
        <td>${actualUnload}</td>
        <td>${newDelays}</td>
      </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);

    previousDelays = newDelays;
  }

  document.getElementById("tablesContainer").style.display = "block";
  addEditableListeners();
});

const addEditableListeners = () => {
  const tableBody = document.getElementById("simulationTableBody");
  tableBody.addEventListener("input", (event) => {
    const row = event.target.parentElement;

    const previousDelays =
      parseInt(row.querySelector(".previous-delays").textContent) || 0;
    const arrivals = parseInt(row.querySelector(".arrivals").textContent) || 0;

    const totalToUnload = previousDelays + arrivals;
    const randomUnload = parseFloat(row.children[5].textContent);

    const unloadData = lookupValue(randomUnload, unloadingRates);
    const possibleUnload = unloadData ? unloadData.unload : 0;

    const actualUnload = Math.min(totalToUnload, possibleUnload);
    const newDelays = totalToUnload - actualUnload;

    row.children[4].textContent = totalToUnload;
    row.children[6].textContent = actualUnload;
    row.children[7].textContent = newDelays;
  });
};
