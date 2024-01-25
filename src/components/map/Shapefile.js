import { useEffect } from "react";
import PropTypes from "prop-types";
import { useLeaflet } from "react-leaflet";
import L from "leaflet";
import shp from "shpjs";

function Shapefile({ zipUrl }) {
  const { map } = useLeaflet();

  useEffect(() => {
    const geo = L.geoJson(
      { features: [] },
      {
        onEachFeature: function popUp(f, l) {
          var out = [];
          if (f.properties) {
            for (var key in f.properties) {
              out.push(key + ": " + f.properties[key]);
            }
            l.bindPopup(out.join("<br />"));
          }
        }
      }
    ).addTo(map);

    shp(zipUrl).then(function (data) {
      geo.addData(data);
    });
  }, []);

  return null;
}

Shapefile.propTypes = {
  zipUrl: PropTypes.string.isRequired
};

export default Shapefile;
