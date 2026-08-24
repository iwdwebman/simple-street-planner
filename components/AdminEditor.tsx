'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Save,
  Plus,
  Trash2,
  TrendingUp,
  MapPin,
  FileCheck,
} from 'lucide-react';
import {
  PlayFile,
  DemandRoute,
  LaneDefinition,
  IngressPoint,
  OutgressPoint,
} from '@/lib/types/street';
import { VehicleType, VEHICLE_CONFIGS } from '@/lib/types/vehicle';
import { StorageManager } from '@/lib/storage/StorageManager';

interface AdminEditorProps {
  playFile: PlayFile;
  lanes: LaneDefinition[];
  onChange: (updatedPlayFile: PlayFile) => void;
  onSaveCustom: (scenarioName: string) => void;
}

export default function AdminEditor({
  playFile,
  lanes,
  onChange,
  onSaveCustom,
}: AdminEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scenarioNameInput, setScenarioNameInput] = useState(playFile.name);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 1. Demand Routes Management
  const handleAddRoute = () => {
    const defaultIngress = playFile.ingressPoints[0]?.id || `ingress_${lanes[0]?.id}`;
    const defaultOutgress = playFile.outgressPoints[0]?.id || `outgress_${lanes[0]?.id}`;
    const newRoute: DemandRoute = {
      id: `route_${Date.now()}`,
      name: `New Demand Flow`,
      originIngressId: defaultIngress,
      destinationOutgressId: defaultOutgress,
      vehicleType: 'car',
      baseRatePerMinute: 10,
    };
    onChange({ ...playFile, demandRoutes: [...playFile.demandRoutes, newRoute] });
  };

  const handleUpdateRoute = (index: number, updates: Partial<DemandRoute>) => {
    const routes = [...playFile.demandRoutes];
    routes[index] = { ...routes[index], ...updates };
    onChange({ ...playFile, demandRoutes: routes });
  };

  const handleDeleteRoute = (index: number) => {
    const routes = playFile.demandRoutes.filter((_: DemandRoute, i: number) => i !== index);
    onChange({ ...playFile, demandRoutes: routes });
  };

  // 2. Hourly Factors Update
  const handleHourlyFactorChange = (hourIndex: number, factor: number) => {
    const factors = [...playFile.timeOfDayProfile.hourlyFactors];
    factors[hourIndex] = factor;
    onChange({
      ...playFile,
      timeOfDayProfile: {
        ...playFile.timeOfDayProfile,
        hourlyFactors: factors,
      },
    });
  };

  // 3. Play File JSON Export/Import
  const handleExportJSON = () => {
    StorageManager.exportPlayFileJSON(playFile);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = StorageManager.parsePlayFileJSON(text);
        onChange(parsed);
        setSaveSuccessMsg('Imported scenario successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } catch (err: any) {
        alert('Failed to import scenario JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveToLocalStorage = () => {
    onSaveCustom(scenarioNameInput);
    setSaveSuccessMsg('Scenario saved to LocalStorage!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="admin-editor-panel">
      <div className="admin-header">
        <div className="title-group">
          <h2>⚙️ Admin Scenario & Demand Matrix Editor</h2>
          <p>
            Configure ingress/outgress endpoints, origin-destination demand flows per vehicle type,
            and 24-hour diurnal volume curves to create reusable scenario play files.
          </p>
        </div>

        {/* Play File Persistence Toolbar */}
        <div className="admin-playfile-toolbar">
          <input
            type="text"
            value={scenarioNameInput}
            onChange={(e) => setScenarioNameInput(e.target.value)}
            placeholder="Scenario Name..."
            className="scenario-name-input"
          />
          <button className="btn-action btn-primary" onClick={handleSaveToLocalStorage}>
            <Save size={14} /> Save Play File
          </button>
          <button className="btn-action btn-secondary" onClick={handleExportJSON}>
            <Download size={14} /> Export JSON
          </button>
          <button
            className="btn-action btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="alert-success">
          <FileCheck size={14} /> {saveSuccessMsg}
        </div>
      )}

      {/* Demand Routes Section */}
      <div className="admin-section">
        <div className="section-header">
          <h3>
            <MapPin size={16} /> Origin-Destination (OD) Demand Routes
          </h3>
          <button className="btn-tiny-add" onClick={handleAddRoute}>
            <Plus size={13} /> Add Demand Route
          </button>
        </div>

        <div className="routes-table-container">
          <table className="routes-table">
            <thead>
              <tr>
                <th>Route Name</th>
                <th>Origin Ingress</th>
                <th>Destination Outgress</th>
                <th>Vehicle Type</th>
                <th>Peak Flow (veh/min)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {playFile.demandRoutes.map((route: DemandRoute, idx: number) => (
                <tr key={route.id || idx}>
                  <td>
                    <input
                      type="text"
                      value={route.name}
                      onChange={(e) => handleUpdateRoute(idx, { name: e.target.value })}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <select
                      value={route.originIngressId}
                      onChange={(e) => handleUpdateRoute(idx, { originIngressId: e.target.value })}
                      className="table-select"
                    >
                      {playFile.ingressPoints.map((ing: IngressPoint) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={route.destinationOutgressId}
                      onChange={(e) => handleUpdateRoute(idx, { destinationOutgressId: e.target.value })}
                      className="table-select"
                    >
                      {playFile.outgressPoints.map((out: OutgressPoint) => (
                        <option key={out.id} value={out.id}>
                          {out.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={route.vehicleType}
                      onChange={(e) =>
                        handleUpdateRoute(idx, { vehicleType: e.target.value as VehicleType })
                      }
                      className="table-select"
                    >
                      {(Object.keys(VEHICLE_CONFIGS) as VehicleType[]).map((vKey) => {
                        const meta = VEHICLE_CONFIGS[vKey];
                        return (
                          <option key={vKey} value={vKey}>
                            {meta.label} ({meta.category})
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td>
                    <div className="rate-stepper">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        step={1}
                        value={route.baseRatePerMinute}
                        onChange={(e) =>
                          handleUpdateRoute(idx, { baseRatePerMinute: parseFloat(e.target.value) || 0 })
                        }
                        className="num-input-small"
                      />
                      <span>/min</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-tiny btn-danger"
                      onClick={() => handleDeleteRoute(idx)}
                      title="Delete Route"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 24-Hour Diurnal Demand Curve Editor */}
      <div className="admin-section">
        <div className="section-header">
          <h3>
            <TrendingUp size={16} /> 24-Hour Time-of-Day Hourly Modulation Profile
          </h3>
          <span className="info-badge">Hourly Multipliers (0.0x to 2.5x)</span>
        </div>

        <div className="diurnal-chart-grid">
          {playFile.timeOfDayProfile.hourlyFactors.map((factor: number, hour: number) => {
            const hourLabel =
              hour === 0
                ? '12 AM'
                : hour === 12
                ? '12 PM'
                : hour < 12
                ? `${hour} AM`
                : `${hour - 12} PM`;

            const isPeak = factor >= 1.5;

            return (
              <div key={hour} className={`hour-column-card ${isPeak ? 'peak-hour' : ''}`}>
                <div className="hour-bar-wrapper">
                  <div
                    className="hour-bar-fill"
                    style={{ height: `${Math.min(100, (factor / 2.5) * 100)}%` }}
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={2.5}
                  step={0.05}
                  value={factor}
                  onChange={(e) => handleHourlyFactorChange(hour, parseFloat(e.target.value) || 0)}
                  className="hour-factor-input"
                />
                <span className="hour-label">{hourLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
