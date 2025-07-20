const pinList = document.getElementById('pinList');
const searchInput = document.getElementById('searchInput');

const map = L.map('map').setView([20.5937, 78.9629], 5);
let markers = [];
let savedPins = JSON.parse(localStorage.getItem('pins')) || [];

// Initialize tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add saved pins on loading the page
savedPins.forEach(pin => addPin(pin));

// When you click on the map
map.on('click', async function (e) {
    // console.log(e);
    const { lat, lng } = e.latlng;
    const remark = prompt('Enter a remark for this location:');
    if (!remark) return;

    let address;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        // console.log(res.body);
        const data = await res.json();
        address = data.display_name || 'Address not found';
    } catch {
        address = 'Failed to fetch address';
    }

    const pin = { lat, lng, remark, address };
    savedPins.push(pin);
    localStorage.setItem('pins', JSON.stringify(savedPins));
    addPin(pin, true);
});

function addPin(pin, openPopup = false) {
    // Map marker
    const marker = L.marker([pin.lat, pin.lng]);
    marker.addTo(map);
    marker.bindPopup(`<b>Remark:</b> ${pin.remark}<br><b>Address:</b> ${pin.address}`);
    if (openPopup) marker.openPopup();

    // Store pins & marker
    markers.push({ ...pin, marker });

    // Sidebar entry
    const div = document.createElement('div');
    div.className = 'pin-item';
    div.innerHTML = `
        <div>
          <strong>${pin.remark}</strong><br>
          <small>${pin.address}</small><br>
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </div>
      `;

    // When you click on list, It will show location on the map
    div.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return; // avoid conflict with buttons
        map.setView([pin.lat, pin.lng], 13);
        marker.openPopup();
    });

    // Delete pin
    div.querySelector('.delete').addEventListener('click', () => {
        map.removeLayer(marker);
        markers = markers.filter(m => m.lat !== pin.lat || m.lng !== pin.lng);
        savedPins = savedPins.filter(p => p.lat !== pin.lat || p.lng !== pin.lng);
        localStorage.setItem('pins', JSON.stringify(savedPins));
        pinList.removeChild(div);
    });

    // Edit remark
    div.querySelector('.edit').addEventListener('click', () => {
        const newRemark = prompt('Edit your remark:', pin.remark);
        if (!newRemark) return;
        pin.remark = newRemark;
        marker.setPopupContent(`<b>Remark:</b> ${pin.remark}<br><b>Address:</b> ${pin.address}`);
        localStorage.setItem('pins', JSON.stringify(savedPins));
        div.querySelector('strong').innerText = newRemark;
    });

    pinList.appendChild(div);
}

// Search filtering
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const items = pinList.querySelectorAll('.pin-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
    });
});