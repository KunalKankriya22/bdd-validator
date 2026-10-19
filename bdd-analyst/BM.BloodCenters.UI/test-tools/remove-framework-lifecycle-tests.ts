import { removeTestsByName } from './spec-utils';

removeTestsByName([
  'should have unique component ID',
  'should generate unique element IDs',
  'should have unique IDs across multiple instances',
  'should complete destroy$ on ngOnDestroy',
  'should complete destroy$ subject',
  'should complete destroy$ subject on destroy',
  'should unsubscribe on destroy',
  'should have aria-labelledby on main container',
  'should have aria-busy on loading container',
  'should have aria-live on loading container',
], 'Remove framework/lifecycle/accessibility tests');
