import React, { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, MapPin } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Select } from "./Select";
import { useTimeClockMutation } from "../helpers/useTimeClockMutation";
import { useLocationsQuery } from "../helpers/useInventoryQueries";
import {
  schema as timeClockSchema,
  InputType,
} from "../endpoints/timeclock/punch_POST.schema";
import styles from "./TimeClock.module.css";

type PunchStatus = "clocked_in" | "clocked_out";

export const TimeClock = ({ className }: { className?: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<PunchStatus | null>(null);
  const [todaysHours, setTodaysHours] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [lastPunch, setLastPunch] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useLocationsQuery();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InputType>({
    resolver: zodResolver(timeClockSchema),
  });

  const timeClockMutation = useTimeClockMutation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedLocationId = watch("locationId");

  const onSubmit: SubmitHandler<InputType> = async (data) => {
    setError(null);
    console.log("Submitting time clock punch:", { 
      employeeCode: data.employeeCode, 
      locationId: data.locationId 
    });
    
    timeClockMutation.mutate(data, {
      onSuccess: (result) => {
        console.log("Time clock punch successful:", result);
        setStatus(result.status);
        setTodaysHours(result.todaysHours);
        setEmployeeName(result.employeeName);
        setLastPunch(new Date(result.lastPunch));
        setCurrentLocation(result.locationName || null);
        // Clear form but preserve location selection
        const currentLocationId = selectedLocationId;
        reset();
        if (currentLocationId) {
          setValue("locationId", currentLocationId);
        }
      },
      onError: (err) => {
        console.error("Time clock punch failed:", err);
        setError(err.message);
      },
    });
  };

  const renderStatus = () => {
    if (timeClockMutation.isPending) {
      return <Skeleton className={styles.statusSkeleton} />;
    }
    if (!status) {
      return <Badge variant="outline">Ingrese credenciales para marcar</Badge>;
    }
    return (
      <Badge variant={status === "clocked_in" ? "success" : "default"}>
        {status === "clocked_in" ? "Marcado (Entrada)" : "Marcado (Salida)"}
      </Badge>
    );
  };

  const getPunchButtonText = () => {
    if (timeClockMutation.isPending) {
      return "Procesando...";
    }
    return status === "clocked_in" ? "Marcar Salida" : "Marcar Entrada";
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <Clock className={styles.headerIcon} />
        <div className={styles.timeDisplay}>
          <span className={styles.time}>{format(currentTime, "HH:mm:ss")}</span>
          <span className={styles.date}>{format(currentTime, "eeee, MMMM do")}</span>
        </div>
      </div>

      <div className={styles.statusSection}>
        <div className={styles.statusInfo}>
          <span className={styles.statusLabel}>Estado</span>
          {renderStatus()}
        </div>
        <div className={styles.hoursInfo}>
          <span className={styles.hoursLabel}>Horas Hoy</span>
          <span className={styles.hoursValue}>
            {todaysHours !== null ? todaysHours.toFixed(2) : "--:--"}
          </span>
        </div>
      </div>

      {currentLocation && (
        <div className={styles.locationInfo}>
          <MapPin className={styles.locationIcon} />
          <span>Ubicación: <strong>{currentLocation}</strong></span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="employeeCode">Código de Empleado</label>
          <input
            id="employeeCode"
            type="text"
            className={styles.input}
            {...register("employeeCode")}
            disabled={timeClockMutation.isPending}
            autoComplete="off"
          />
          {errors.employeeCode && <p className={styles.errorText}>{errors.employeeCode.message}</p>}
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            type="password"
            className={styles.input}
            {...register("pin")}
            disabled={timeClockMutation.isPending}
            autoComplete="off"
          />
          {errors.pin && <p className={styles.errorText}>{errors.pin.message}</p>}
        </div>

        {locationsQuery.data && locationsQuery.data.length > 1 && (
          <div className={styles.inputGroup}>
            <label htmlFor="locationId">Ubicación (Opcional)</label>
            <Select
              value={selectedLocationId?.toString() || ""}
              onValueChange={(value) => setValue("locationId", value ? parseInt(value) : undefined)}
              disabled={timeClockMutation.isPending}
            >
              <option value="">Usar ubicación por defecto</option>
              {locationsQuery.data.map((location) => (
                <option key={location.id} value={location.id.toString()}>
                  {location.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {error && <p className={`${styles.errorText} ${styles.formError}`}>{error}</p>}

        <Button
          type="submit"
          size="lg"
          className={styles.punchButton}
          disabled={timeClockMutation.isPending}
        >
          {timeClockMutation.isPending ? (
            "Procesando..."
          ) : (
            <>
              {status === "clocked_in" ? <LogOut /> : <LogIn />}
              <span>{getPunchButtonText()}</span>
            </>
          )}
        </Button>
      </form>

      <div className={styles.footer}>
        {employeeName && (
          <p>
            Bienvenido, <strong>{employeeName}</strong>.
          </p>
        )}
        {lastPunch && (
          <p className={styles.lastPunchText}>
            Última marca: {format(lastPunch, "HH:mm:ss")}
          </p>
        )}
      </div>
    </div>
  );
};