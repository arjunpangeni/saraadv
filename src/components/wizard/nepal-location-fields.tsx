"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import {
  NEPAL_PROVINCES,
  OTHER_LOCAL_BODY,
  districtsInProvince,
  localBodiesInDistrict,
  provinceOfDistrict,
} from "@/lib/nepal-locations";

export type NepalLocationValue = {
  province: string;
  district: string;
  localBody: string;
  ward: string;
};

function districtOptions(province: string, current: string) {
  const listed = province ? districtsInProvince(province) : [];
  const options = listed.map((name) => ({ value: name, label: name }));
  if (current && !listed.includes(current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}

function localBodyOptions(district: string, current: string) {
  const listed = localBodiesInDistrict(district);
  const options = listed.map((name) => ({ value: name, label: name }));
  if (listed.length > 0) {
    options.push({ value: OTHER_LOCAL_BODY, label: OTHER_LOCAL_BODY });
  }
  if (current && !options.some((o) => o.value === current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}

export function NepalLocationFields({
  value,
  onChange,
  idPrefix,
  title,
  errors,
}: {
  value: NepalLocationValue;
  onChange: (next: NepalLocationValue) => void;
  idPrefix: string;
  title?: string;
  errors?: Partial<Record<"province" | "district" | "localBody", string>>;
}) {
  const districts = districtOptions(value.province, value.district);
  const bodies = localBodyOptions(value.district, value.localBody);

  return (
    <div className="rounded-lg border border-border-subtle bg-background/50 p-3">
      {title ? <p className="mb-3 text-sm font-medium text-foreground">{title}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <SelectField
            id={`${idPrefix}-province`}
            aria-label="Province"
            value={value.province}
            placeholder="Province"
            className={errors?.province ? "border-destructive" : undefined}
            onValueChange={(province) =>
              onChange({ province, district: "", localBody: "", ward: value.ward })
            }
            options={NEPAL_PROVINCES.map((p) => ({ value: p, label: p }))}
          />
          {errors?.province ? <p className="mt-1 text-sm text-destructive">{errors.province}</p> : null}
        </div>
        <div>
          <SelectField
            id={`${idPrefix}-district`}
            aria-label="District"
            value={value.district}
            placeholder="District"
            className={errors?.district ? "border-destructive" : undefined}
            disabled={!value.province && !value.district}
            onValueChange={(district) =>
              onChange({
                ...value,
                district,
                province: provinceOfDistrict(district) || value.province,
                localBody: "",
              })
            }
            options={districts}
          />
          {errors?.district ? <p className="mt-1 text-sm text-destructive">{errors.district}</p> : null}
        </div>
        <div>
          <SelectField
            id={`${idPrefix}-localBody`}
            aria-label="Local body"
            value={value.localBody}
            placeholder="Local body"
            className={errors?.localBody ? "border-destructive" : undefined}
            disabled={!value.district}
            onValueChange={(localBody) => onChange({ ...value, localBody })}
            options={bodies}
          />
          {errors?.localBody ? <p className="mt-1 text-sm text-destructive">{errors.localBody}</p> : null}
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-ward`} className="sr-only">
            Ward
          </Label>
          <Input
            id={`${idPrefix}-ward`}
            placeholder="Ward (optional)"
            value={value.ward}
            onChange={(e) => onChange({ ...value, ward: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
