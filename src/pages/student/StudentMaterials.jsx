import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStudentMaterialsForCurrentUser } from "../../services/studentService";

function StudentMaterials() {
  const { session, profile } = useAuth();

  const [materialData, setMaterialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadMaterials() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getStudentMaterialsForCurrentUser(
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

    loadMaterials();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading materials...</h2>
        <p>Please wait while your learning materials are loaded.</p>
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
  const student = materialData?.student || {};

  const excelMaterials = materials.filter((material) => material.tool === "Excel");
  const powerBiMaterials = materials.filter(
    (material) => material.tool === "Power BI"
  );
  const sqlMaterials = materials.filter((material) => material.tool === "SQL");
  const pythonMaterials = materials.filter((material) => material.tool === "Python");

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Learning Materials</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. Access published
            learning materials from your assigned Jlux Academy tutor.
          </p>
        </div>

        <button>View Assignments</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Materials</p>
          <h2>{materials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Excel</p>
          <h2>{excelMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Power BI</p>
          <h2>{powerBiMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>SQL</p>
          <h2>{sqlMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Python</p>
          <h2>{pythonMaterials.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Course</p>
          <h2>{student.enrolled_course || "Data Analysis"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Student Code</p>
          <h2>{student.student_code || "N/A"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Assigned Tutor</p>
          <h2>{student.tutors?.profiles?.full_name || "Not assigned"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>My Learning Materials</h2>

        {materials.length === 0 ? (
          <p>
            No published materials are available yet. Once your tutor uploads
            materials, they will appear here.
          </p>
        ) : (
          <div className="materialsGrid">
            {materials.map((material) => (
              <article className="materialCard" key={material.id}>
                <div>
                  <span className={`statusPill ${material.status}`}>
                    {material.status}
                  </span>

                  <h3>{material.title}</h3>

                  <p>{material.description || "No description provided."}</p>

                  <div className="assignmentMeta">
                    <span>Tool: {material.tool || "General"}</span>
                    <span>Type: {material.material_type || "link"}</span>
                    <span>
                      Tutor:{" "}
                      {material.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </span>
                  </div>

                  <small>
                    Added:{" "}
                    {material.created_at
                      ? new Date(material.created_at).toLocaleDateString()
                      : "-"}
                  </small>
                </div>

                {material.material_url ? (
                  <a
                    className="tableActionBtn materialLink"
                    href={material.material_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Material
                  </a>
                ) : (
                  <span className="mutedText">No link available</span>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Materials Rule</h2>
        <p>
          Only published materials from your assigned tutor are shown here.
          Draft materials remain hidden until your tutor publishes them.
        </p>
      </div>
    </section>
  );
}

export default StudentMaterials;