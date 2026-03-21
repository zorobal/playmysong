import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("establishments");
  const [establishments, setEstablishments] = useState([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newEstablishment, setNewEstablishment] = useState({
    name: "",
    city: "",
    district: "",
    phoneNumber: "",
    additionalInfo: ""
  });
  
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: ""
  });

  const navigate = useNavigate();
  const accessToken = localStorage.getItem("token");

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }
    loadData();
  }, [accessToken, navigate]);

  async function loadData() {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      
      const estsData = await fetch(`${API_URL}/establishments`, { headers }).then(r => r.json());
      
      setEstablishments(estsData || []);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createEstablishment(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/establishments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(newEstablishment)
      });
      
      if (res.ok) {
        alert("Établissement créé avec succès!");
        setShowCreateModal(false);
        setNewEstablishment({
          name: "",
          city: "",
          district: "",
          phoneNumber: "",
          additionalInfo: ""
        });
        loadData();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Inconnu"));
      }
    } catch (err) {
      alert("Erreur lors de la création");
    }
  }

  async function deleteEstablishment(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet établissement? Cette action est irréversible.")) return;
    try {
      const res = await fetch(`${API_URL}/establishments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (res.ok) {
        alert("Établissement supprimé avec succès!");
        loadData();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Impossible de supprimer l'établissement"));
      }
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  async function showQRCode(establishmentId) {
    try {
      const est = establishments.find(e => e.id === establishmentId);
      setSelectedEstablishment(est);
      const res = await fetch(`${API_URL}/establishments/${establishmentId}/qrcode`);
      const data = await res.json();
      setQrCodeData(data);
      setShowQRModal(true);
    } catch (err) {
      alert("Erreur lors de la génération du QR Code");
    }
  }

  async function addAdmin(establishmentId) {
    try {
      const res = await fetch(`${API_URL}/establishments/${establishmentId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ admins: [newAdmin] })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Erreur: " + (data.error || "Inconnu"));
        return;
      }
      alert("Administrateur ajouté!");
      setShowAdminModal(false);
      setNewAdmin({ name: "", email: "", password: "", phoneNumber: "" });
      
      const estRes = await fetch(`${API_URL}/establishments/${establishmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const estData = await estRes.json();
      setSelectedEstablishment(estData);
      loadData();
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
  }

  async function deleteAdmin(adminId) {
    if (!confirm("Supprimer cet administrateur?")) return;
    try {
      await fetch(`${API_URL}/users/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  }

  async function deleteUser(userId) {
    if (!confirm("Supprimer cet utilisateur?")) return;
    try {
      await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      loadData();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="superadmin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎵 PlayMySong</h1>
          <span className="subtitle">Administration Centrale</span>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === "establishments" ? "active" : ""}`}
          onClick={() => setActiveTab("establishments")}
        >
          🏪 Établissements ({establishments.length})
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "establishments" && (
          <div className="establishments-panel">
            <div className="panel-header">
              <h2>Gestion des Établissements</h2>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                + Nouvel Établissement
              </button>
            </div>

            <div className="establishments-grid">
              {establishments.map(est => (
                <div key={est.id} className="establishment-card">
                  <div className="card-header">
                    <h3>{est.name}</h3>
                  </div>
                  
                  <div className="card-info">
                    <p><strong>Nom:</strong> {est.name}</p>
                    <p><strong>Ville:</strong> {est.city || "-"}</p>
                    <p><strong>Quartier:</strong> {est.district || "-"}</p>
                    <p><strong>Téléphone:</strong> {est.phoneNumber || "-"}</p>
                    {est.additionalInfo && <p><strong>Infos:</strong> {est.additionalInfo}</p>}
                    <p><strong>Admins:</strong> {est.users?.filter(u => u.role === "ADMIN").length || 0}</p>
                    <p><strong>Users:</strong> {est.users?.filter(u => u.role === "USER").length || 0}</p>
                    <p><strong>Playlists:</strong> {est.playlists?.length || 0}</p>
                  </div>

                  <div className="card-actions">
                    <button onClick={() => setSelectedEstablishment(est)}>
                      Voir détails
                    </button>
                    <button onClick={() => showQRCode(est.id)}>
                      📱 QR Code
                    </button>
                    <button className="btn-danger" onClick={() => deleteEstablishment(est.id)}>
                      Supprimer
                    </button>
                  </div>

                  <div className="admins-section">
                    <h4>Administrateurs</h4>
                    {est.users && est.users.length > 0 ? (
                      <ul>
                        {est.users.filter(u => u.role === "ADMIN").map(admin => (
                          <li key={admin.id}>
                            <span>👤 {admin.name} ({admin.email}) {admin.createdBy && <span className="created-by">Créé par: {admin.createdBy}</span>}</span>
                            <button onClick={() => deleteAdmin(admin.id)}>×</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-admin">Aucun administrateur</p>
                    )}
                    <button 
                      className="btn-small"
                      onClick={() => {
                        setSelectedEstablishment(est);
                        setShowAdminModal(true);
                      }}
                    >
                      + Ajouter Admin
                    </button>
                  </div>

                  <div className="playlists-section">
                    <h4>Playlists</h4>
                    {est.playlists && est.playlists.length > 0 ? (
                      <ul>
                        {est.playlists.map(pl => (
                          <li key={pl.id}>
                            <span>🎵 {pl.name} {pl.createdBy && <span className="created-by">par: {pl.createdBy}</span>}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-playlist">Aucune playlist</p>
                    )}
                  </div>

                  <div className="users-section">
                    <h4>Utilisateurs (Clients)</h4>
                    {est.users && est.users.filter(u => u.role === "USER").length > 0 ? (
                      <ul>
                        {est.users.filter(u => u.role === "USER").map(user => (
                          <li key={user.id}>
                            <span>👤 {user.name || user.email} {user.createdBy && <span className="created-by">par: {user.createdBy}</span>}</span>
                            <button onClick={() => deleteUser(user.id)}>×</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-user">Aucun utilisateur</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {establishments.length === 0 && (
              <div className="empty-state">
                <p>Aucun établissement enregistré</p>
                <button onClick={() => setShowCreateModal(true)}>
                  Créer le premier établissement
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Créer un Établissement</h3>
            <form onSubmit={createEstablishment}>
              <div className="form-group">
                <label>Nom de l'établissement *</label>
                <input
                  required
                  value={newEstablishment.name}
                  onChange={e => setNewEstablishment({ ...newEstablishment, name: e.target.value })}
                  placeholder="Ex: Le Bar Tropical"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ville</label>
                  <input
                    value={newEstablishment.city}
                    onChange={e => setNewEstablishment({ ...newEstablishment, city: e.target.value })}
                    placeholder="Ex: Kinshasa"
                  />
                </div>
                <div className="form-group">
                  <label>Quartier</label>
                  <input
                    value={newEstablishment.district}
                    onChange={e => setNewEstablishment({ ...newEstablishment, district: e.target.value })}
                    placeholder="Ex: Gombe"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  value={newEstablishment.phoneNumber}
                  onChange={e => setNewEstablishment({ ...newEstablishment, phoneNumber: e.target.value })}
                  placeholder="+243..."
                />
              </div>
              <div className="form-group">
                <label>Informations supplémentaires</label>
                <textarea
                  value={newEstablishment.additionalInfo}
                  onChange={e => setNewEstablishment({ ...newEstablishment, additionalInfo: e.target.value })}
                  placeholder="Adresse, horaires, etc."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && selectedEstablishment && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ajouter un Admin - {selectedEstablishment.name}</h3>
            <form onSubmit={(e) => { e.preventDefault(); addAdmin(selectedEstablishment.id); }}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  required
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  value={newAdmin.phoneNumber}
                  onChange={e => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAdminModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEstablishment && !showAdminModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h3>{selectedEstablishment.name}</h3>
            <div className="establishment-details">
              <p><strong>Ville:</strong> {selectedEstablishment.city}</p>
              <p><strong>Quartier:</strong> {selectedEstablishment.district}</p>
              <p><strong>Téléphone:</strong> {selectedEstablishment.phoneNumber}</p>
              <p><strong>URL Client:</strong> {API_URL}/?establishmentId={selectedEstablishment.id}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => showQRCode(selectedEstablishment.id)}>📱 Voir QR Code</button>
              <button onClick={() => setSelectedEstablishment(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && qrCodeData && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>QR Code - {selectedEstablishment?.name}</h3>
            <div className="qr-code-container">
              <img src={qrCodeData.qrCode} alt="QR Code" />
            </div>
            <p className="qr-url">{qrCodeData.url}</p>
            <p className="qr-instruction">Imprimez ce QR Code et placez-le dans votre établissement</p>
            <div className="modal-actions">
              <button onClick={() => {
                const link = document.createElement('a');
                link.download = `qrcode-${selectedEstablishment?.name}.png`;
                link.href = qrCodeData.qrCode;
                link.click();
              }}>Télécharger PNG</button>
              <button onClick={() => setShowQRModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .superadmin-dashboard {
          min-height: 100vh;
          background: #f0f2f5;
        }
        .dashboard-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left h1 { margin: 0; font-size: 1.8rem; }
        .subtitle { opacity: 0.8; }
        .btn-logout {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        .dashboard-tabs {
          display: flex;
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 0 30px;
        }
        .tab {
          padding: 18px 25px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-size: 1rem;
        }
        .tab.active {
          border-bottom-color: #1a1a2e;
          color: #1a1a2e;
          font-weight: bold;
        }
        .dashboard-content { padding: 30px; }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .btn-primary {
          background: #4caf50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .establishments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
        }
        .establishment-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .card-header {
          margin-bottom: 15px;
        }
        .card-header h3 { margin: 0; color: #1a1a2e; }
        
        .card-info p { margin: 8px 0; color: #555; }
        
        .card-actions {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .card-actions button {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          min-width: 100px;
        }
        .card-actions .btn-danger {
          background: #ffebee;
          color: #f44336;
          border-color: #ffebee;
        }
        
        .admins-section {
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .admins-section h4 { margin: 0 0 10px 0; }
        .admins-section ul { list-style: none; padding: 0; }
        .admins-section li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .admins-section li button {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .no-admin { color: #999; font-style: italic; }
        .no-playlist { color: #999; font-style: italic; }
        .created-by { font-size: 0.8em; color: #888; margin-left: 8px; }
        
        .playlists-section {
          border-top: 1px solid #eee;
          padding-top: 15px;
          margin-top: 15px;
        }
        .playlists-section h4 { margin: 0 0 10px 0; }
        .playlists-section ul { list-style: none; padding: 0; }
        .playlists-section li {
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .users-section {
          border-top: 1px solid #eee;
          padding-top: 15px;
          margin-top: 15px;
        }
        .users-section h4 { margin: 0 0 10px 0; color: #666; }
        .users-section ul { list-style: none; padding: 0; }
        .users-section li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .users-section li button {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .no-user { color: #999; font-style: italic; }
        
        .btn-small {
          background: #e3f2fd;
          color: #1976d2;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          padding: 30px;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-large { max-width: 700px; }
        .modal h3 { margin-top: 0; color: #1a1a2e; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 25px;
        }
        .modal-actions button {
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid #ddd;
          background: white;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 16px;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }
        .qr-code-container {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          margin: 20px 0;
        }
        .qr-code-container img {
          max-width: 100%;
          height: auto;
        }
        .qr-url {
          word-break: break-all;
          font-size: 0.85rem;
          color: #666;
          background: #f5f5f5;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .qr-instruction {
          font-size: 0.9rem;
          color: #888;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}

export default SuperAdminDashboard;
