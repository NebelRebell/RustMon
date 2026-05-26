import { UmodComponent, Plugin } from './umod.component';

function makePlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'TestPlugin',
    name: 'TestPlugin',
    author: 'Author',
    file: 'TestPlugin.cs',
    sizeBytes: 1024,
    size: '1 KB',
    timeMs: 100,
    time: '0.10s',
    version: '1.0.0',
    loaded: true,
    loading: false,
    ...overrides
  };
}

describe('UmodComponent sortPlugins', () => {
  let component: UmodComponent;

  beforeEach(() => {
    component = new UmodComponent(null as any, null as any);
    component.plugins = [
      makePlugin({ id: 'Zeta', sizeBytes: 500, timeMs: 200 }),
      makePlugin({ id: 'Alpha', sizeBytes: 3000, timeMs: 50 }),
      makePlugin({ id: 'Middle', sizeBytes: 1000, timeMs: 150 }),
    ];
  });

  it('sorts alphabetically ascending by id', () => {
    component.sortPlugins('id');
    expect(component.plugins.map(p => p.id)).toEqual(['Alpha', 'Middle', 'Zeta']);
    expect(component.sortOrder).toBe(1);
  });

  it('sorts alphabetically descending on second call', () => {
    component.sortPlugins('id');
    component.sortPlugins('id');
    expect(component.plugins.map(p => p.id)).toEqual(['Zeta', 'Middle', 'Alpha']);
    expect(component.sortOrder).toBe(-1);
  });

  it('sorts numerically by sizeBytes ascending', () => {
    component.sortPlugins('sizeBytes');
    expect(component.plugins.map(p => p.sizeBytes)).toEqual([500, 1000, 3000]);
  });

  it('sorts numerically by sizeBytes descending on toggle', () => {
    component.sortPlugins('sizeBytes');
    component.sortPlugins('sizeBytes');
    expect(component.plugins.map(p => p.sizeBytes)).toEqual([3000, 1000, 500]);
  });

  it('sorts numerically by timeMs ascending', () => {
    component.sortPlugins('timeMs');
    expect(component.plugins.map(p => p.timeMs)).toEqual([50, 150, 200]);
  });

  it('resets sort order to ascending when switching field', () => {
    component.sortPlugins('id');
    component.sortPlugins('id');
    expect(component.sortOrder).toBe(-1);
    component.sortPlugins('sizeBytes');
    expect(component.sortOrder).toBe(1);
    expect(component.sortField).toBe('sizeBytes');
  });

  it('filteredPlugins filters by id', () => {
    component.filterTerm = 'alpha';
    expect(component.filteredPlugins.length).toBe(1);
    expect(component.filteredPlugins[0].id).toBe('Alpha');
  });

  it('filteredPlugins returns all when filter is empty', () => {
    component.filterTerm = '';
    expect(component.filteredPlugins.length).toBe(3);
  });
});
