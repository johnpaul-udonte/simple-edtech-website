import { useEffect, useState } from "react";
import { getMaterialsForAdmin } from "../../services/adminService";

function AdminMaterials() {
  const [materialData, setMaterialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadMaterials() {
      const { data, error } = await getMaterialsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setMaterialData(data);
      setIsLoading(false);
    }

    loadMaterials();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading materials...</h2>
        <p>Please wait while learning material records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Admin materials issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const materials = materialData?.materials || [];
  const summary = materialData?.summary || {};
  const toolReports = materialData?.toolReports || [];
  const tutorReports = materialData?.tutorReports || [];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Learning Materials</h1>
          <p>
            Monitor all learning materials uploaded by tutors, including tool
            category, publication status, visibility, links, and tutor ownership.
          </p>
        </div>

        <button>Export Materials</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Materials</p>
          <h2>{summary.totalMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{summary.publishedMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{summary.draftMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Excel</p>
          <h2>{summary.excelMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Power BI</p>
          <h2>{summary.powerBiMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>SQL</p>
          <h2>{summary.sqlMaterials || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Python</p>
          <h2>{summary.pythonMaterials || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>All Materials</h2>

        {materials.length === 0 ? (
          <p>No learning materials have been added yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Tutor</th>
                <th>Tool</th>
                <th>Type</th>
                <th>Visibility</th>
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

                  <td>
                    {material.tutors?.profiles?.full_name ||
                      "Tutor not assigned"}
                    <br />
                    <small>{material.tutors?.profiles?.email || "-"}</small>
                  </td>

                  <td>{material.tool || "General"}</td>

                  <td>{material.material_type || "link"}</td>

                  <td>{material.visibility || "students"}</td>

                  <td>
                    <span className={`statusPill ${material.status}`}>
                      {material.status}
                    </span>
                  </td>

                  <td>
                    {material.material_url ? (
                      <a
                        href={material.material_url}
                        target="_blank"
                        rel="noreferrer"
                      >
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

      <div className="dashboardPanel">
        <h2>Materials by Tool</h2>

        {toolReports.length === 0 ? (
          <p>No tool report available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tool</th>
                <th>Total</th>
                <th>Published</th>
                <th>Draft</th>
              </tr>
            </thead>

            <tbody>
              {toolReports.map((item) => (
                <tr key={item.tool}>
                  <td>{item.tool}</td>
                  <td>{item.total}</td>
                  <td>{item.published}</td>
                  <td>{item.draft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Materials by Tutor</h2>

        {tutorReports.length === 0 ? (
          <p>No tutor material report available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Email</th>
                <th>Total Materials</th>
                <th>Published</th>
                <th>Draft</th>
              </tr>
            </thead>

            <tbody>
              {tutorReports.map((item) => (
                <tr key={item.tutorName}>
                  <td>{item.tutorName}</td>
                  <td>{item.email}</td>
                  <td>{item.total}</td>
                  <td>{item.published}</td>
                  <td>{item.draft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Admin Materials Rule</h2>
        <p>
          Tutors can create learning materials from their portal. Students only
          see published materials from their assigned tutor. Admin can monitor
          all materials here.
        </p>
      </div>
    </section>
  );
}

export default AdminMaterials;

export async function getAnnouncementsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      body,
      audience,
      priority,
      status,
      expires_at,
      created_at,
      updated_at,
      profiles:author_profile_id (
        full_name,
        email,
        role
      ),
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const allAnnouncements = announcements || [];

  return {
    data: {
      announcements: allAnnouncements,
      summary: {
        totalAnnouncements: allAnnouncements.length,
        publishedAnnouncements: allAnnouncements.filter(
          (item) => item.status === "published"
        ).length,
        draftAnnouncements: allAnnouncements.filter(
          (item) => item.status === "draft"
        ).length,
        highPriorityAnnouncements: allAnnouncements.filter(
          (item) => item.priority === "high"
        ).length,
        urgentAnnouncements: allAnnouncements.filter(
          (item) => item.priority === "urgent"
        ).length,
      },
    },
    error: null,
  };
}

export async function createAnnouncementForAdmin(userId, announcementForm) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title: announcementForm.title,
      body: announcementForm.body,
      audience: announcementForm.audience,
      priority: announcementForm.priority,
      status: announcementForm.status,
      expires_at: announcementForm.expires_at || null,
      author_profile_id: userId,
      tutor_id: null,
      updated_at: new Date().toISOString(),
    })
    .select();

  return {
    data: Array.isArray(insertedRows) ? insertedRows[0] : null,
    error: insertError,
  };
}