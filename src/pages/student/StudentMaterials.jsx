function StudentMaterials() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Learning Materials</h1>
          <p>Download class files, templates, datasets, and lesson notes.</p>
        </div>
      </div>

      <div className="dashboardPanel">
        <h2>Available Materials</h2>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Tool</th>
              <th>Type</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Excel Dashboard Dataset</td>
              <td>Excel</td>
              <td>XLSX</td>
              <td>Download</td>
            </tr>
            <tr>
              <td>Power BI Sales Report Guide</td>
              <td>Power BI</td>
              <td>PDF</td>
              <td>Download</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StudentMaterials;