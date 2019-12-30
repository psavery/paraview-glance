import { DEFAULT_BACKGROUND } from 'paraview-glance/src/components/core/VtkView/palette';

import { Actions, Mutations } from 'paraview-glance/src/store/types';

export default {
  state: {
    backgroundColor: DEFAULT_BACKGROUND,
    orientationAxis: true,
    // from VtkView
    orientationPreset: 'default',
    // from VtkView
    axisType: 'arrow',
    interactionStyle3D: '3D',
  },

  mutations: {
    // ------------------
    // External mutations
    // ------------------

    GLOBAL_BG(state, bg) {
      state.backgroundColor = bg;
    },
    GLOBAL_ORIENT_AXIS(state, flag) {
      state.orientationAxis = flag;
    },
    GLOBAL_ORIENT_PRESET(state, preset) {
      state.orientationPreset = preset;
    },
    GLOBAL_AXIS_TYPE(state, axisType) {
      state.axisType = axisType;
    },
    GLOBAL_INTERACTION_STYLE_3D(state, style) {
      state.interactionStyle3D = style;
    },
  },

  actions: {
    // ------------------
    // External actions
    // ------------------

    SET_GLOBAL_BG({ commit }, bg) {
      commit(Mutations.GLOBAL_BG, bg);
    },
    SET_GLOBAL_ORIENT_AXIS({ commit, rootState }, flag) {
      rootState.proxyManager.getViews().forEach((view) => {
        view.setOrientationAxesVisibility(flag);
        view.renderLater();
      });

      commit(Mutations.GLOBAL_ORIENT_AXIS, flag);
    },
    SET_GLOBAL_ORIENT_PRESET({ commit, rootState }, preset) {
      rootState.proxyManager.getViews().forEach((view) => {
        view.setPresetToOrientationAxes(preset);
        view.renderLater();
      });

      commit(Mutations.GLOBAL_ORIENT_PRESET, preset);
    },
    SET_GLOBAL_AXIS_TYPE({ commit, dispatch, rootState, state }, axisType) {
      rootState.proxyManager.getViews().forEach((view) => {
        view.setOrientationAxesType(axisType);
      });

      commit(Mutations.GLOBAL_AXIS_TYPE, axisType);

      // will call view.renderLater()
      dispatch(Actions.SET_GLOBAL_ORIENT_PRESET, state.orientationPreset);
    },
    SET_GLOBAL_INTERACTION_STYLE_3D({ commit, rootState }, style) {
      const allViews = rootState.proxyManager.getViews();
      allViews
        .filter((v) => v.getName() === 'default')
        .forEach((view) => {
          view.setPresetToInteractor3D(style);
        });

      commit(Mutations.GLOBAL_INTERACTION_STYLE_3D, style);
    },
  },
};
