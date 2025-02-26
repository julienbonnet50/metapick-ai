import path from 'path';
import { promises as fs } from 'fs'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
 
export default async function Home() {

  const dataBrawlers = await fetch(`http://127.0.0.1:5000/get_brawlers`, { cache: 'no-store' })
  const dataMaps = await fetch(`http://127.0.0.1:5000/get_maps`, { cache: 'no-store' })

  var brawlers = await dataBrawlers.json();
  var maps = await dataMaps.json();

  console.log("Brawlers : " , brawlers);
  console.log("Maps : " , maps);
  return (
    <div className="container">
      <h1 className="text-center">Brawl Stars Draft Simulator</h1>
      <form id="draftForm" method="POST" action="/simulate_draft">
        <div className="form-group">
          <label htmlFor="map">Map Name</label>
          <select className="form-control" id="map" name="map" required>
            {maps.map((map: any, index: number) => (
              <option key={index} value={map}>
                {map[0]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="excluded_brawlers">Excluded Brawlers</label>
          <select
            className="form-control select2"
            id="excluded_brawlers"
            name="excluded_brawlers"
            multiple
          >
            {brawlers.map((brawler: any, index: number) => (
              <option key={index} value={brawler}>
                {brawler.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="initial_team">Initial Team</label>
          <select className="form-control select2" id="initial_team" name="initial_team" multiple>
            {brawlers.map((brawler: any, index: number) => (
              <option key={index} value={brawler}>
                {brawler.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="initial_opponent">Initial Opponent</label>
          <select className="form-control select2" id="initial_opponent" name="initial_opponent" multiple>
            {brawlers.map((brawler: any, index: number) => (
              <option key={index} value={brawler}>
                {brawler.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="firstpick">First Pick</label>
          <div className="btn-group btn-group-toggle" data-toggle="buttons">
            <label className="btn btn-primary active">
              <input type="radio" name="firstpick" id="A" value="A" autoComplete="off" defaultChecked /> Team A
            </label>
            <label className="btn btn-danger">
              <input type="radio" name="firstpick" id="B" value="B" autoComplete="off" /> Team B
            </label>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-block">Simulate Draft</button>
      </form>
      <div id="result" className="mt-4"></div>

      {/* Tab Content */}
      <div className="tab-content" id="resultsTabContent">
        <div className="tab-pane fade show active" id="top15" role="tabpanel" aria-labelledby="top15-tab">
          <div id="top15Brawlers" className="top15-brawlers mt-4"></div>
        </div>

        <div className="tab-pane fade" id="draft-results" role="tabpanel" aria-labelledby="draft-results-tab">
          <div id="top-brawlers" className="mt-4">
            <h2>Top Brawlers</h2>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Brawler</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody id="top-brawlers-body">
                {/* Rows will be dynamically added here */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// think about Use State for text input