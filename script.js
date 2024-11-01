// Menu de navigation

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active'); // Activer/désactiver l'animation du bouton hamburger
}

let map;

function initMap() {
    // Initialiser la carte centrée sur Lyon
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 45.764043, lng: 4.835659 }, // Coordonnées de Lyon
        zoom: 12,
    });

    initAutocomplete(); // Active l'autocomplétion après le chargement de la carte
}

function initAutocomplete() {
    const departureInput = document.getElementById("departure");
    const destinationInput = document.getElementById("destination");

    // Activer l'autocomplétion pour les champs de saisie
    const departureAutocomplete = new google.maps.places.Autocomplete(departureInput);
    const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);
}

// Fonction pour ajouter une étape supplémentaire
function addStop() {
    const extraStopsContainer = document.getElementById("extraStops");
    const stopInput = document.createElement("input");
    stopInput.type = "text";
    stopInput.placeholder = "Entrez une étape supplémentaire";
    stopInput.className = "extra-stop";
    extraStopsContainer.appendChild(stopInput);
}

// Fonction pour calculer le tarif estimé en fonction des options sélectionnées
function calculateFare() {
    const vehicleType = document.getElementById("vehicleType").value;
    const transferType = document.getElementById("transferType").value;
    const departure = document.getElementById("departure").value;
    const destination = document.getElementById("destination").value;
    const departureTime = document.getElementById("departureTime").value;
    const [hour] = departureTime.split(":").map(Number); // Extraire l'heure sélectionnée
    const extraStops = document.getElementsByClassName("extra-stop").length;

    // Si les adresses de départ et de destination ne sont pas remplies, arrêter
    if (!departure || !destination) {
        alert("Veuillez remplir les adresses de départ et de destination.");
        return;
    }

    // Définir les tarifs de base
    let baseFare = 0;
    let perKmRate = 0;
    let hourlyRate = 0;
    let stopCharge = 0;

    if (vehicleType === "berline") {
        baseFare = 15;
        perKmRate = transferType === "allerRetour" ? 2 : 2.25;
        hourlyRate = 65;
        stopCharge = 3;
    } else if (vehicleType === "suv") {
        baseFare = 15;
        perKmRate = transferType === "allerRetour" ? 2.45 : 2.70;
        hourlyRate = 75;
        stopCharge = 4;
    } else if (vehicleType === "van") {
        baseFare = 25;
        perKmRate = transferType === "allerRetour" ? 3.25 : 3.50;
        hourlyRate = 110;
        stopCharge = 5;
    }

    // Ajouter les coûts pour les étapes supplémentaires
    baseFare += extraStops * stopCharge;

    // Vérifier si c'est une mise à disposition
    if (transferType === "miseDispo") {
        baseFare += hourlyRate * 2; // Minimum de 2 heures
        document.getElementById("calculatedFare").innerText = `€ ${baseFare.toFixed(2)}`;
        document.getElementById("fareResult").style.display = "block";
        return;
    }

    // Utiliser le service Distance Matrix pour obtenir la distance
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [departure],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                alert("Erreur lors du calcul de la distance.");
            } else {
                const distanceKm = response.rows[0].elements[0].distance.value / 1000; // Convertir en km

                // Calculer les frais par kilomètre
                let baseDistanceCharge = distanceKm * perKmRate;

                // Calculer le tarif de nuit si l'heure de départ est entre 19h et 7h
                const isNight = (hour >= 19 || hour < 7);
                if (isNight) {
                    baseFare *= 1.5; // Augmentation de 50% pour les trajets de nuit
                    baseDistanceCharge *= 1.5;
                }

                // Calcul final
                const totalFare = baseFare + baseDistanceCharge;
                document.getElementById("calculatedFare").innerText = `€ ${totalFare.toFixed(2)}`;
                document.getElementById("fareResult").style.display = "block";
            }
        }
    );
}

// Fonction pour envoyer la réservation par SMS
function sendSmsReservation() {
    const vehicleType = document.getElementById("vehicleType").value;
    const transferType = document.getElementById("transferType").value;
    const departure = document.getElementById("departure").value;
    const destination = document.getElementById("destination").value;
    const departureTime = document.getElementById("departureTime").value;
    const estimatedFare = document.getElementById("calculatedFare").innerText;

    // Récupérer toutes les étapes supplémentaires
    const extraStopsElements = document.getElementsByClassName("extra-stop");
    let extraStops = "";
    for (let i = 0; i < extraStopsElements.length; i++) {
        extraStops += `Étape ${i + 1} : ${extraStopsElements[i].value}\n`;
    }

    // Construire le message SMS avec les informations de réservation
    const message = `Nouvelle réservation :
    Type de véhicule : ${vehicleType}
    Type de transfert : ${transferType}
    Départ : ${departure}
    Destination : ${destination}
    Heure de départ : ${departureTime}
    ${extraStops}Tarif estimé : ${estimatedFare}`;

    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);

    // Créer le lien SMS avec le numéro du chauffeur
    const smsLink = `sms:+33768007615?body=${encodedMessage}`; // Remplacez +330123456789 par le numéro du chauffeur

    // Rediriger vers le lien SMS pour ouvrir l'application de SMS avec le message pré-rempli
    window.location.href = smsLink;
}


