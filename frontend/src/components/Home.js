import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      {/* Blood Donation Info Section */}
      <section className="blood-info-section">
        <div className="container">
          <h2 className="section-title">Understanding Blood Donation</h2>
          <div className="blood-info-grid">
            <div className="blood-info-card">
              <div className="blood-icon">🩸</div>
              <h3>What is Blood Donation?</h3>
              <p>Blood donation is a voluntary process where a person has their blood drawn and stored for transfusion into another person who needs it. It's a safe, simple procedure that takes about 10-15 minutes.</p>
            </div>
            <div className="blood-info-card">
              <div className="blood-icon">💉</div>
              <h3>The Donation Process</h3>
              <p>After registration and screening, a sterile needle is used to collect blood. The process is painless and supervised by trained medical professionals. You can donate every 56 days.</p>
            </div>
            <div className="blood-info-card">
              <div className="blood-icon">🔬</div>
              <h3>Blood Types & Compatibility</h3>
              <p>There are 8 main blood types: A+, A-, B+, B-, AB+, AB-, O+, O-. Type O- is the universal donor, while AB+ can receive from any type.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Flow Visualization */}
      <section className="blood-flow-section">
        <div className="container">
          <h2 className="section-title">The Journey of Blood</h2>
          <div className="blood-flow-container">
            <div className="flow-step">
              <div className="flow-icon">❤️</div>
              <h4>Heart</h4>
              <p>Pumps blood through the body</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">🫁</div>
              <h4>Lungs</h4>
              <p>Oxygenates the blood</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">🧠</div>
              <h4>Brain & Organs</h4>
              <p>Delivers oxygen & nutrients</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon">🩸</div>
              <h4>Back to Heart</h4>
              <p>Cycle continues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">Benefits of Blood Donation</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💪</div>
              <h3>Health Benefits</h3>
              <ul>
                <li>Reduces risk of heart disease</li>
                <li>Stimulates blood cell production</li>
                <li>Helps maintain healthy iron levels</li>
                <li>Free health screening included</li>
              </ul>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌍</div>
              <h3>Community Impact</h3>
              <ul>
                <li>Saves up to 3 lives per donation</li>
                <li>Supports emergency situations</li>
                <li>Helps cancer patients</li>
                <li>Supports surgery patients</li>
              </ul>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🧬</div>
              <h3>Scientific Benefits</h3>
              <ul>
                <li>Advances medical research</li>
                <li>Improves transfusion medicine</li>
                <li>Helps develop new treatments</li>
                <li>Contributes to medical knowledge</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Human Body Diagram */}
      <section className="body-diagram-section">
        <div className="container">
          <h2 className="section-title">Blood in the Human Body</h2>
          <div className="body-diagram">
            <div className="body-outline">
              <div className="body-part head">
                <span className="part-label">Brain</span>
                <span className="blood-amount">15%</span>
              </div>
              <div className="body-part heart">
                <span className="part-label">Heart</span>
                <span className="blood-amount">5%</span>
              </div>
              <div className="body-part lungs">
                <span className="part-label">Lungs</span>
                <span className="blood-amount">12%</span>
              </div>
              <div className="body-part liver">
                <span className="part-label">Liver</span>
                <span className="blood-amount">25%</span>
              </div>
              <div className="body-part kidneys">
                <span className="part-label">Kidneys</span>
                <span className="blood-amount">20%</span>
              </div>
              <div className="body-part muscles">
                <span className="part-label">Muscles</span>
                <span className="blood-amount">20%</span>
              </div>
            </div>
            <div className="diagram-info">
              <h3>Blood Distribution</h3>
              <p>The average adult has about 5 liters of blood circulating through their body. Each donation removes approximately 450ml (less than 10% of total blood volume).</p>
              <div className="blood-facts">
                <div className="fact">
                  <strong>Total Blood:</strong> 5 liters
                </div>
                <div className="fact">
                  <strong>Donation Amount:</strong> 450ml
                </div>
                <div className="fact">
                  <strong>Replacement Time:</strong> 24-48 hours
            </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="user-types-section">
        <h2 className="section-title">Choose Your Role</h2>
        <div className="user-types-grid">
          <div className="user-type-card user-card">
            <div className="card-icon">👤</div>
            <h3>User</h3>
            <p>Are you a donor or patient? Login to access your dashboard and manage your blood donation activities.</p>
            <div className="card-actions">
              <Link to="/user" className="btn btn-primary">Login</Link>
              <Link to="/user-register" className="btn btn-secondary">Register</Link>
            </div>
          </div>

          <div className="user-type-card admin-card">
            <div className="card-icon">⚙️</div>
            <h3>Administrator</h3>
            <p>Manage the blood bank, monitor inventory, and coordinate donations.</p>
            <div className="card-actions">
              <Link to="/admin" className="btn btn-primary">Login</Link>
            </div>
          </div>
        </div>
      </section>



      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Make a Difference?</h2>
          <p>Join thousands of donors who are saving lives every day.</p>
          <Link to="/user-register" className="btn btn-large">Register as User Today</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;