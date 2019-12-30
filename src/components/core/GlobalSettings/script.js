import GpuInformation from 'paraview-glance/src/components/widgets/GPUInformation';
import PalettePicker from 'paraview-glance/src/components/widgets/PalettePicker';
import { BACKGROUND } from 'paraview-glance/src/components/core/VtkView/palette';
import { Actions } from 'paraview-glance/src/store/types';

const INTERACTION_STYLES_3D = [
  { text: 'Default', value: '3D' },
  { text: 'First Person', value: 'FirstPerson' },
];

const ORIENTATION_PRESETS = [
  { text: 'XYZ', value: 'default' },
  { text: 'LPS', value: 'lps' },
];

const AXIS_TYPES = [
  { text: 'Arrows', value: 'arrow' },
  { text: 'Cube', value: 'cube' },
];

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

function getDefaultViews(pxm) {
  return pxm.getViews().filter((v) => v.getName() === 'default');
}

// ----------------------------------------------------------------------------

function getFirstPersonMovementSpeed(pxm) {
  const views = getDefaultViews(pxm);
  for (let i = 0; i < views.length; ++i) {
    const interactorStyle = views[i].getInteractorStyle3D();
    const manipulators = interactorStyle.getKeyboardManipulators();
    for (let j = 0; j < manipulators.length; ++j) {
      if (manipulators[j].getMovementSpeed) {
        return manipulators[j].getMovementSpeed();
      }
    }
  }
  return undefined;
}

// ----------------------------------------------------------------------------

function setFirstPersonMovementSpeed(pxm, speed) {
  getDefaultViews(pxm).forEach((view) => {
    const interactorStyle = view.getInteractorStyle3D();
    const manipulators = interactorStyle.getKeyboardManipulators();
    manipulators.forEach((manipulator) => {
      if (manipulator.setMovementSpeed) {
        manipulator.setMovementSpeed(speed);
      }
    });
  });
}

// ----------------------------------------------------------------------------

function setAnnotationOpacity(opacity) {
  this.proxyManager
    .getViews()
    .forEach((view) => view.setAnnotationOpacity(opacity));
}

// ----------------------------------------------------------------------------

function pushGlobalSettings() {
  this.$store.dispatch(Actions.SET_GLOBAL_ORIENT_AXIS, this.orientationAxis);
  this.setAnnotationOpacity(this.annotationOpacity);
}

// ----------------------------------------------------------------------------

function getViewForVR() {
  const views = this.proxyManager.getViews();
  for (let i = 0; i < views.length; i++) {
    if (views[i].getProxyName() === 'View3D') {
      return views[i];
    }
  }
  return null;
}

// ----------------------------------------------------------------------------

export default {
  name: 'GlobalSettings',
  components: {
    PalettePicker,
    GpuInformation,
  },
  data() {
    return {
      palette: BACKGROUND,
      interactionStyles3D: INTERACTION_STYLES_3D,
      annotationOpacity: 1,
      orientationPresets: ORIENTATION_PRESETS,
      axisTypes: AXIS_TYPES,
      vrEnabled: false,
      physicalScale: 1,
      basePhysicalScale: 1,
    };
  },
  computed: {
    proxyManager() {
      return this.$store.state.proxyManager;
    },
    backgroundColor: {
      get() {
        return this.$store.state.global.backgroundColor;
      },
      set(color) {
        this.$store.dispatch(Actions.SET_GLOBAL_BG, color);
      },
    },
    interactionStyle3D: {
      get() {
        return this.$store.state.global.interactionStyle3D;
      },
      set(style) {
        this.$store.dispatch(Actions.SET_GLOBAL_INTERACTION_STYLE_3D, style);
      },
    },
    firstPersonInteraction() {
      return this.$store.state.global.interactionStyle3D === 'FirstPerson';
    },
    firstPersonMovementSpeed: {
      get() {
        return getFirstPersonMovementSpeed(this.proxyManager);
      },
      set(speed) {
        setFirstPersonMovementSpeed(this.proxyManager, speed);
      },
    },
    orientationAxis: {
      get() {
        return this.$store.state.global.orientationAxis;
      },
      set(flag) {
        this.$store.dispatch(Actions.SET_GLOBAL_ORIENT_AXIS, flag);
      },
    },
    orientationPreset: {
      get() {
        return this.$store.state.global.orientationPreset;
      },
      set(preset) {
        this.$store.dispatch(Actions.SET_GLOBAL_ORIENT_PRESET, preset);
      },
    },
    axisType: {
      get() {
        return this.$store.state.global.axisType;
      },
      set(axisType) {
        this.$store.dispatch(Actions.SET_GLOBAL_AXIS_TYPE, axisType);
      },
    },
  },
  watch: {
    annotationOpacity: setAnnotationOpacity,
    physicalScale() {
      const view = this.getViewForVR();
      if (view) {
        view
          .getCamera()
          .setPhysicalScale(
            this.basePhysicalScale / Number(this.physicalScale)
          );
      }
    },
  },
  methods: {
    hasVR() {
      const view = this.getViewForVR();
      return view && !!view.getOpenglRenderWindow().getVrDisplay();
    },
    setAnnotationOpacity,
    pushGlobalSettings,
    getViewForVR,
    toggleVR(vr) {
      const view = this.getViewForVR();
      if (view) {
        const camera = view.getCamera();
        const renderer = view.getRenderer();
        const glRenderWindow = view.getOpenglRenderWindow();
        if (vr) {
          view.setOrientationAxesVisibility(false);
          renderer.resetCamera();
          this.basePhysicalScale = camera.getPhysicalScale();
          this.physicalScale = 1;

          // ------------------------------------------------------------------
          // Reorient physical space
          // ------------------------------------------------------------------
          const unit = (v) => (v > 0 ? 1 : -1);
          const north = camera.getDirectionOfProjection();
          const northMax = Math.max(...north.map(Math.abs));
          camera.setPhysicalViewNorth(
            north.map((v) => (Math.abs(v) === northMax ? unit(v) : 0))
          );

          const up = camera.getViewUp();
          const upMax = Math.max(...up.map(Math.abs));
          camera.setPhysicalViewUp(
            up.map((v) => (Math.abs(v) === upMax ? unit(v) : 0))
          );
          // ------------------------------------------------------------------

          // Start VR finally
          glRenderWindow.startVR();
        } else {
          glRenderWindow.stopVR();
          view.setOrientationAxesVisibility(this.orientationAxis);
        }
      }
    },
  },
  created() {
    this.subscription = this.proxyManager.onProxyRegistrationChange(() => {
      this.pushGlobalSettings();
    });
  },
  beforeDestroy() {
    this.subscription.unsubscribe();
  },
};
