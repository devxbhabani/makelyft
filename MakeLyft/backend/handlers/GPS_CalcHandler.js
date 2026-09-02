//Usign ORSM

const axios = require('axios');


async function getRouting(start, end){

    const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
    try {
        const response = await axios.get(url);
        // Returns an array of [longitude, latitude] arrays representing the road
        return response.data.routes[0].geometry.coordinates;
    } catch (error) {
        console.log("Error in OSRM Routing: ",error);
        return null;
    }
}

module.exports = { getRouting };
