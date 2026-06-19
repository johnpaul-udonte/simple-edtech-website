import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createMaterialForTutor,
  getTutorMaterialsForCurrentUser,
} from "../../services/tutorService";

function TutorMaterials() {
  const { session, profile } = useAuth();

  const [materialData, setMaterialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    tool: "Excel",
    material_type: "link",
    material_url: "",
    visibility: "students",
    status: "published",
  });

  async function loadMaterials() {
    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorMaterialsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setMaterialData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadMaterials();
  }, [session]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setMaterialForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateMaterial(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");

    if (!materialForm.title.trim()) {
      setActionError("Material title is required.");
      return;
    }

    if (!materialForm.material_url.trim()) {
      setActionError("Material link is required.");
      return;
    }

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Tutor session not found. Please log in again.");
      return;
    }

    setIsCreating(true);

    const { error } = await createMaterialForTutor(userId, materialForm);

    if (error) {
      setActionError(error.message);
      setIsCreating(false);
      return;
    }

    setSuccessMessage("Learning material added successfully.");

    setMaterialForm({
      title: "",
      description: "",
      tool: "Excel",
      material_type: "link",
      material_url: "",
      visibility: "students",
      status: "published",
    });

    await loadMaterials();
    setIsCreating(false);
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading materials...</h2>
        <p>Please wait while your materials are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Materials issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const materials = materialData?.materials || [];
  const publishedMaterials = materials.filter(
    (material) => material.status === "published"
  );
  const draftMaterials = materials.filter((material) => material.status === "draft");

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Learning Materials</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Add class materials,
            links, resources, and practice files for your students.
          </p>
        </div>

        <button>Add Material</button>
      </div>

      {successMessage && (
        <div className="successNotice">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {actionError && (
        <div className="errorNotice">
          <strong>Error:</strong> {actionError}
        </div>
      )}

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Materials</p>
          <h2>{materials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{publishedMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{draftMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Specialisation</p>
          <h2>{materialData?.tutor?.specialisation || "Not set"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Add New Material</h2>

        <form className="portalForm" onSubmit={handleCreateMaterial}>
          <div className="formGrid">
            <label>
              Material Title
              <input
                type="text"
                name="title"
                value={materialForm.title}
                onChange={handleFormChange}
                placeholder="Example: Excel Pivot Table Guide"
              />
            </label>

            <label>
              Tool
              <select
                name="tool"
                value={materialForm.tool}
                onChange={handleFormChange}
              >
                <option value="Excel">Excel</option>
                <option value="Power BI">Power BI</option>
                <option value="SQL">SQL</option>
                <option value="Python">Python</option>
                <option value="General">General</option>
              </select>
            </label>

            <label>
              Material Type
              <select
                name="material_type"
                value={materialForm.material_type}
                onChange={handleFormChange}
              >
                <option value="link">Link</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="dataset">Dataset</option>
                <option value="practice">Practice File</option>
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={materialForm.status}
                onChange={handleFormChange}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label>
            Material Link
            <input
              type="url"
              name="material_url"
              value={materialForm.material_url}
              onChange={handleFormChange}
              placeholder="Paste Google Drive, YouTube, OneDrive, or website link"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={materialForm.description}
              onChange={handleFormChange}
              rows="4"
              placeholder="Explain what this material is for."
            />
          </label>

          <button className="tableActionBtn" type="submit" disabled={isCreating}>
            {isCreating ? "Adding..." : "Add Material"}
          </button>
        </form>
      </div>

      <div className="dashboardPanel">
        <h2>Material List</h2>

        {materials.length === 0 ? (
          <p>No materials have been added yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Tool</th>
                <th>Type</th>
                <th>Status</th>
                <th>Link</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>
                    <strong>{material.title}</strong>
                    <br />
                    <small>{material.description || "No description"}</small>
                  </td>

                  <td>{material.tool || "General"}</td>

                  <td>{material.material_type || "link"}</td>

                  <td>
                    <span className={`statusPill ${material.status}`}>
                      {material.status}
                    </span>
                  </td>

                  <td>
                    {material.material_url ? (
                      <a href={material.material_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    {material.created_at
                      ? new Date(material.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default TutorMaterials;