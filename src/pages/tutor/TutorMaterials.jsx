function TutorMaterials() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Learning Materials</h1>
          <p>Upload and manage class files, datasets, notes, templates, and lesson resources.</p>
        </div>

        <button>Upload Material</button>
      </div>

      <div className="dashboardPanel">
        <h2>Uploaded Materials</h2>

        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Tool</th>
              <th>File Type</th>
              <th>Visibility</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Excel Pivot Table Practice Dataset</td>
              <td>Excel</td>
              <td>XLSX</td>
              <td>Students</td>
            </tr>
            <tr>
              <td>Power BI Dashboard Template</td>
              <td>Power BI</td>
              <td>PBIX</td>
              <td>Students</td>
            </tr>
            <tr>
              <td>SQL Joins Practice File</td>
              <td>SQL</td>
              <td>SQL</td>
              <td>Students</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorMaterials;