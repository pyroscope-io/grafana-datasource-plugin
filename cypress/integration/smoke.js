describe('smoke', () => {
  // Since we are testing the datasource plugin only
  // We don't do any assertions against the panel
  it('makes requests to the datasource', () => {
    cy.intercept('**/render*', {
      fixture: 'simple-golang-app-cpu.json',
    }).as('render');

    cy.visit('http://localhost:3000/d/single-panel/pyroscope-demo?orgId=1');

    cy.intercept(
      'http://localhost:3000/api/datasources/proxy/1/render/render?format=json&from=now-5m&until=now&queryType=randomWalk&refId=A&datasource=Pyroscope&query=pyroscope.server.cpu'
    ).as('renderRequest');

    cy.wait('@renderRequest');
  });

  it('auto completes', () => {
    cy.visit(
      'http://localhost:3000/d/single-panel/single-panel-dashboard?orgId=1&editPanel=2&from=1678718500926&to=1678719100926'
    );

    cy.intercept('**/api/datasources/proxy/1/render/api/apps', {
      fixture: 'appNames',
    }).as('appNames');

    // CTRL + SPACE
    cy.get('.query-editor-row [data-slate-editor]').clear().type(`{ctrl}`).trigger('keydown', { keyCode: 32 });

    // 10 elements + header
    cy.get('ul.typeahead li').should('have.length', 11);
  });
});
