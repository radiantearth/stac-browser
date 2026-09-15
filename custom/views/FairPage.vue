<template>
  <div class="fair-page-container">
    <div class="fair-content">
      <h1 class="fair-title">The FAIR Guiding Principles</h1>
      <h2 class="h4 mb-3 text-secondary">Findable, Accessible, Interoperable, and Reusable</h2>
      <h3 class="h5 mb-4 text-muted">A Framework for Open Science and Data Stewardship</h3>
      <hr class="mb-5">

      <section class="mb-5 lead-section">
        <p class="lead">
          In 2016, the <strong>FAIR Guiding Principles for scientific data management and stewardship</strong> were published in <em>Scientific Data</em>. These principles provide a guideline for those wishing to enhance the reusability of their data holdings.
        </p>
        <p>
          The principles put specific emphasis on enhancing the ability of machines to automatically find and use the data, in addition to supporting its reuse by individuals. Here is a placeholder overview of the four core pillars.
        </p>
      </section>

      <!-- Findable -->
      <section id="findable" class="mb-5">
        <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
          <span class="badge bg-warning me-2 text-dark">F</span> Findable
        </h3>
        <p>
          The first step in reusing data is to find them. Metadata and data should be easy to find for both humans and computers. Machine-readable metadata are essential for automatic discovery of datasets and services.
        </p>
        <ul>
          <li><strong>F1.</strong> (Meta)data are assigned a globally unique and persistent identifier.</li>
          <li><strong>F2.</strong> Data are described with rich metadata.</li>
          <li><strong>F3.</strong> Metadata clearly and explicitly include the identifier of the data they describe.</li>
          <li><strong>F4.</strong> (Meta)data are registered or indexed in a searchable resource.</li>
        </ul>
      </section>

      <!-- Accessible -->
      <section id="accessible" class="mb-5">
        <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
          <span class="badge bg-primary me-2">A</span> Accessible
        </h3>
        <p>
          Once the user finds the required data, they need to know how these can be accessed, possibly including authentication and authorisation.
        </p>
        <ul>
          <li><strong>A1.</strong> (Meta)data are retrievable by their identifier using a standardised communications protocol.</li>
          <li><strong>A1.1</strong> The protocol is free, open, and universally implementable.</li>
          <li><strong>A1.2</strong> The protocol allows for an authentication and authorisation procedure, where necessary.</li>
          <li><strong>A2.</strong> Metadata are accessible, even when the data are no longer available.</li>
        </ul>
      </section>

      <!-- Interoperable -->
      <section id="interoperable" class="mb-5">
        <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
          <span class="badge bg-danger me-2">I</span> Interoperable
        </h3>
        <p>
          The data usually need to be integrated with other data. In addition, the data need to interoperate with applications or workflows for analysis, storage, and processing.
        </p>
        <ul>
          <li><strong>I1.</strong> (Meta)data use a formal, accessible, shared, and broadly applicable language for representation.</li>
          <li><strong>I2.</strong> (Meta)data use vocabularies that follow FAIR principles.</li>
          <li><strong>I3.</strong> (Meta)data include qualified references to other (meta)data.</li>
        </ul>
      </section>

      <!-- Reusable -->
      <section id="reusable" class="mb-5">
        <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
          <span class="badge bg-success me-2">R</span> Reusable
        </h3>
        <p>
          The ultimate goal of FAIR is to optimise the reuse of data. To achieve this, metadata and data should be well-described so that they can be replicated and/or combined in different settings.
        </p>
        <ul>
          <li><strong>R1.</strong> (Meta)data are richly described with a plurality of accurate and relevant attributes.</li>
          <li><strong>R1.1.</strong> (Meta)data are released with a clear and accessible data usage license.</li>
          <li><strong>R1.2.</strong> (Meta)data are associated with detailed provenance.</li>
          <li><strong>R1.3.</strong> (Meta)data meet domain-relevant community standards.</li>
        </ul>
      </section>

      <p class="text-muted text-center mt-5">
        <small>
          For more details, visit the official
          <a href="https://www.go-fair.org/fair-principles/" target="_blank" rel="noopener">GO FAIR Initiative</a>.
        </small>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "FairPage"
};
</script>

<style scoped>
.fair-page-container {
  width: 100%;
  max-width: calc(1400px + 4rem);
  margin: 0 auto;
  padding: 32px 2rem 48px 2rem;
  box-sizing: border-box;
}

@media (max-width: 45em) {
  .fair-page-container {
    max-width: calc(1400px + 3rem);
    padding: 16px 1.5rem;
  }
}

.fair-title {
  font-family: "NotesESAbold", sans-serif;
  color: #003247;
  font-size: 2.5rem;
  font-weight: normal;
  margin: 0 0 1rem 0;
}

@media (max-width: 960px) {
  .fair-title {
    font-size: 1.8rem;
  }
}

.fair-content p {
  line-height: 1.6;
}
.fair-content a {
  color: #006699 !important;
  text-decoration: underline !important;
}
.fair-content a:hover {
  color: #004d66 !important;
}
.badge {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
</style>
