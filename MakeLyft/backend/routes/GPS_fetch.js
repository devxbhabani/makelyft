const { getRouting } = require('../handlers/GPS_CalcHandler');

// Store active intervals so we can clear them if needed
const activeRides = {};

async function startLiveTracking(io, ride_id, startCoords, endCoords, tripPhase) {
    // Prevent duplicate tracking loops for the same ride
    if (activeRides[ride_id]) {
        clearInterval(activeRides[ride_id]);
    }

    // Fetch the route coordinates between start and end
    const routeCoords = await getRouting(
        `${startCoords[1]},${startCoords[0]}`, // OSRM expects lon,lat
        `${endCoords[1]},${endCoords[0]}`
    );

    if (!routeCoords || routeCoords.length === 0) {
        console.error("Failed to get routing for GPS tracking");
        return;
    }

    let currentIndex = 0;

    activeRides[ride_id] = setInterval(() => {
        // Stop moving when we reach the end of the array
        if (currentIndex >= routeCoords.length) {
            clearInterval(activeRides[ride_id]);
            delete activeRides[ride_id];
            
            io.to(`ride_${ride_id}`).emit('location_update', { 
                status: 'Arrived', 
                phase: tripPhase,
                currentLocation: routeCoords[routeCoords.length - 1]
            });
            return;
        }

        // Emit the live GPS coordinate to the frontend
        io.to(`ride_${ride_id}`).emit('location_update', {
            status: 'Moving',
            phase: tripPhase,
            currentLocation: routeCoords[currentIndex] 
        });

        currentIndex++;
    }, 2000); // Move the car every 2 seconds for a smooth use-case
}

function stopLiveTracking(ride_id) {
    if (activeRides[ride_id]) {
        clearInterval(activeRides[ride_id]);
        delete activeRides[ride_id];
    }
}

module.exports = { startLiveTracking, stopLiveTracking };