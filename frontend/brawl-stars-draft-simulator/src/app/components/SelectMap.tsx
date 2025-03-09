import React from 'react';

interface MapBs {
  name: string;
  gameMode: string;
  imageUrl: string;
}

const SelectMap: React.FC<{ mapsData: MapBs[], selectedMap: string, handleMapChange: any }> = ({
  mapsData,
  selectedMap,
  handleMapChange,
}) => {
  return (
    <div className="flex-1 sm:w-80 w-full max-w-md">
      <select
        className="select select-bordered w-full text-base sm:text-lg py-2 px-3 sm:px-4 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={handleMapChange}
        value={selectedMap}
      >
        <option value="" className="text-gray-500">
          Select a map
        </option>
        {mapsData.map((map, index) => (
          <MapOption key={index} map={map} />
        ))}
      </select>
    </div>
  );
};


const MapOption: React.FC<{ map: MapBs }> = ({ map }) => {
  return (
    <option value={map.name}>
      {map.gameMode} - {map.name}
    </option>
  );
};

export default SelectMap;
