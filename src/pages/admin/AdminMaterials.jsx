function AdminMaterials() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Materials Management</h1>
          <p>
            Upload and manage learning materials, datasets, templates,
            class notes, and downloadable student resources.
          </p>
        </div>

        <button>Upload Material</button>
      </div>

      <div className="dashboardPanel">
        <h2>Learning Materials</h2>

        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Tool</th>
              <th>File Type</th>
              <th>Uploaded By</th>
              <th>Visibility</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Excel Dashboard Dataset</td>
              <td>Excel</td>
              <td>XLSX</td>
              <td>Admin</td>
              <td>Students</td>
            </tr>

            <tr>
              <td>Power BI Sales Report Template</td>
              <td>Power BI</td>
              <td>PBIX</td>
              <td>Tutor</td>
              <td>Students</td>
            </tr>

            <tr>
              <td>SQL Practice Script</td>
              <td>SQL</td>
              <td>SQL</td>
              <td>Admin</td>
              <td>Students</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminMaterials;